/**
 * <ShareSheet pass report onClose/>: preview of the share card + the ways to share it.
 *
 * Phones (touch with the Web Share API): one full-width primary, then Copy link / Post to X / Save PNG.
 * The PNG renders locally once the sheet's entrance is done (an idle callback, ≤ 500 ms), so the tap can
 * call navigator.share synchronously, inside the gesture (Safari drops the share otherwise). The primary
 * reads "Preparing image…" (inert) until the PNG is ready, then "Share image" (the card attached); if the
 * PNG takes longer than 2.5 s or fails, it reads "Share" and shares the text and link alone (R2SH2).
 *
 * Desktop: Post to X (primary) / Copy link / Copy image (pasted into a post as native media), with
 * Save PNG as a quiet text action.
 *
 * Stacked layouts (phones, portrait tablets) build the dialog on the shell's bottom Sheet: a grip, a
 * swipe down closes it, the body scrolls when the card doesn't fit. Wide layouts get a centred dialog.
 * Either way it closes the way it opened (SH5): the frozen clone slides / fades out over the scrim.
 *
 * Nothing is stored until the person actually shares: opening this sheet only previews (and renders
 * the PNG in the browser). The share row (and its short link) is created on the first Share / Copy /
 * Post press, then reused for this pass for the rest of the session.
 *
 * Until the short link exists, a share carries the fallback link: the place link plus the pass's own
 * facts (satellite, time, geometry, capture), so it still unfurls to this pass's card (R2SH2).
 *
 * Privacy: the link carries coordinates rounded to ~1 km, and the card's crop is centred on that
 * rounded point, not the searched one. The fallback link holds only the pass facts a stored share
 * holds. Esc closes this sheet only (it does not also deselect the pass).
 *
 * Every post ends with the credit line "via @armaangupt0", just before the link (R3-14; see links.ts).
 *
 * The overlay contract (R3-16): on stacked layouts the sheet and its scrim cover the globe, so
 * `document.documentElement.dataset.overlay = 'share'` is set while it is open and removed as it starts
 * closing (the globe rests meanwhile and draws a fresh frame for the exit). The globe owns the reader.
 *
 * Language: what is shared is in the app's language when the sheet builds it (the card, the PNG, the post, the file
 * name), and the links carry it (`l=`, not for English) so the unfurl matches the post. The models are keyed by the
 * language, so switching it while the sheet is open rebuilds everything in the new one.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import enShare from '@/i18n/en/share'
import { currentLocale, msgs, useLocale, useMsgs } from '@/i18n/runtime'
import type { Locale } from '../../../api/_lib/i18n/locales'
import { ensureTz, timeZoneAt, tzReady } from '@/imagery'
import { DUR, EASE } from '@/lib/ease'
import { useApp } from '@/state/store'
import { track, type ShareFrom } from '@/lib/telemetry'
import type { Pass, Report } from '@/types'
import { Button, Glyph, Rule, Sheet, cx, useExitClone, useIsMobile, useMediaQuery } from '@/ui/system'
import { isClouded } from '../results/lib/bestLook'
import { captureFor, slug } from '../results/lib/captures'
import { satMeta } from '../results/sats'
import { createShareSafe, peekShare, type CreateShareInput } from './backend'
import { cardSpec, publicLabelOf, renderCardPng, summaryCardSpec, summaryFacts, weekSatellites, type CardSpec } from './card'
import { deepLink, postText, roundedPlace, shareLink, summaryLink, summaryPostText, xIntentUrl } from './links'
import { cardMeasureReady, loadCardMeasure } from './measure'
import { ShareCard } from './ShareCard'
import { useBackLayer } from '@/lib/backStack'
import s from './ShareSheet.module.css'

/**
 * A post's @handles and links as left-to-right islands (<bdi>), the way X draws them: in right-to-left text the "@"
 * is a neutral that would otherwise land after the name ("armaangupt0@"). Only right to left: left to right the text
 * stays one run (a split run is shaped apart, and shifts the handle by a fraction of a pixel).
 */
const HANDLE_OR_LINK = /(@\w+|https?:\/\/\S+)/
function isolateHandles(para: string): React.ReactNode {
  if (typeof document === 'undefined' || document.documentElement.dir !== 'rtl') return para
  const parts = para.split(HANDLE_OR_LINK)
  if (parts.length === 1) return para
  return parts.map((t, i) => (i % 2 ? <bdi key={i}>{t}</bdi> : t))
}

export interface ShareSheetProps {
  /** The pass to share (kind 'pass', the default). */
  pass?: Pass
  report: Report
  onClose: () => void
  /**
   * 'pass' (default): one pass, its card and a short /s/<id> link made on the first share.
   * 'summary' (SH6): the week at the place: its closest look and counts; the link carries the numbers
   * itself, so nothing is stored.
   */
  kind?: 'pass' | 'summary'
  /** The picture is mostly cloud (results' isClouded): the card shows the clouded variant. */
  clouded?: boolean
  /** Scene cloud cover, %, as the results panel shows it (the card reads the capture's own value). */
  cloudPct?: number
  /** Which Share opened the sheet: recorded with its events, so each entry point can be measured (migration 0013). */
  from?: ShareFrom
}

type LinkState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'ready'; url: string; short: boolean }
type Flash = 'link' | 'image' | null

const X_POPUP = 'width=600,height=560'
const COARSE_QUERY = '(pointer: coarse)'
/** The PNG renders once the sheet's entrance leaves the main thread idle, and at the latest after this (a tap before then starts it at once). */
const PNG_IDLE_TIMEOUT_MS = 500
/** How long the phone's primary waits for the PNG ("Preparing image…") before it shares the link alone. */
const PNG_PATIENCE_MS = 2500

/** Run `fn` when the main thread is idle (or after `timeout` ms); returns a cancel function. */
function whenIdle(fn: () => void, timeout: number): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(fn, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const t = window.setTimeout(fn, timeout)
  return () => window.clearTimeout(t)
}

/** True when this browser can hand a PNG file to the system share sheet. */
function canShareFiles(): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([new Uint8Array(1)], 'card.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

function canCopyImage(): boolean {
  if (typeof ClipboardItem === 'undefined' || typeof navigator === 'undefined' || !navigator.clipboard?.write) return false
  const supports = (ClipboardItem as unknown as { supports?: (type: string) => boolean }).supports
  return typeof supports === 'function' ? supports('image/png') : true
}

interface PngJob {
  promise: Promise<Blob>
  blob?: Blob
  file?: File
}

/** Everything one share needs, for a pass or for the week's summary. */
interface ShareModel {
  title: string
  spec: CardSpec
  text: string
  fileName: string
  /** Pass shares: the stored share, made on the first share action. Summaries store nothing. */
  input?: CreateShareInput
  /** Pass: the deep link used when the share service is unavailable. Summary: the link itself. */
  fallbackUrl: string
}

const origin = () => (typeof location !== 'undefined' ? location.origin : '')

/**
 * A pass's share model, in the app's language (`locale` is the active one: the messages come from it, read now).
 */
function passModel(pass: Pass, report: Report, tz: string, host: string, locale: Locale, clouded?: boolean): ShareModel {
  const m = msgs(enShare)
  const place = report.place
  const meta = satMeta(pass.norad)
  const capture = captureFor(report, pass)
  const rounded = roundedPlace(place.lat, place.lon)
  const label = publicLabelOf(place)
  // The card leads with the week's N, as the results headline does (owner): "7 satellites watched Waterloo."
  const satellites = weekSatellites(report, satMeta)
  const spec = cardSpec(pass, { ...report, place: { ...place, label } }, meta, tz, host, { clouded, satellites, locale })
  return {
    // A geostationary image is a scan, not a pass.
    title: pass.geostationary ? m.titleImage : m.titlePass,
    spec,
    text: postText({
      verdict: pass.verdict,
      satName: meta.name,
      placeLabel: label,
      altitudeKm: pass.altitudeKm,
      tClosest: pass.tClosest,
      timeZone: tz,
      pixelM: capture?.gsdM,
      // The same words as the card (cloudWords): the card is clouded exactly when these are defined.
      cloud: capture && spec.sub !== undefined ? { pct: capture.cloudCoverPct, spot: capture.spot } : undefined,
    }),
    fileName: m.pngName(slug(meta.name), slug(label), new Date(pass.tClosest).toISOString().slice(0, 10)),
    input: { placeLabel: label, lat: rounded.lat, lon: rounded.lon, pass, capture, satName: meta.name, satellites },
    fallbackUrl: deepLink(
      origin(),
      label,
      place.lat,
      place.lon,
      pass.id,
      {
        norad: pass.norad,
        satName: meta.name,
        satellites,
        verdict: pass.verdict,
        tClosest: pass.tClosest,
        altitudeKm: pass.altitudeKm,
        offNadirDeg: pass.offNadirDeg,
        headingDeg: pass.headingDeg,
        capture: capture
          ? { collection: capture.collection, itemId: capture.itemId, cloudCoverPct: capture.cloudCoverPct, gsdM: capture.gsdM, spot: capture.spot }
          : undefined,
      },
      locale,
    ),
  }
}

/**
 * Pass models by content (pass, report, zone, host, language, clouded variant), so a reopen is free and the one for
 * the selected pass can be built in idle time before the tap: building it (card spec, local-time formatters, links,
 * post text) was ~30 ms of the sheet's mount task on a phone at 4× CPU.
 */
const passModels = new Map<string, ShareModel>()
const PASS_MODELS_MAX = 16

function cachedPassModel(pass: Pass, report: Report, tz: string, host: string, clouded?: boolean): ShareModel {
  const p = report.place
  const locale = currentLocale()
  // The capture's spot class is in the key: a late spot check writes it into the shown report in place (engine
  // checkSpots), and the card's and the post's cloud words follow it.
  const spot = captureFor(report, pass)?.spot ?? ''
  const key = [pass.id, pass.verdict, pass.captureId ?? '', spot, report.generatedAt, report.passes.length, report.captures.length, p.lat, p.lon, p.label, tz, host, locale, clouded ? 1 : 0].join('|')
  let m = passModels.get(key)
  if (!m) {
    m = passModel(pass, report, tz, host, locale, clouded)
    passModels.set(key, m)
    if (passModels.size > PASS_MODELS_MAX) passModels.delete(passModels.keys().next().value as string)
  }
  return m
}

/** Build the selected pass's share model while the main thread is idle (never on the tap). */
function warmSelectedPass(): () => void {
  let cancel: (() => void) | null = null
  return useApp.subscribe((st, prev) => {
    if (st.selectedPassId === prev.selectedPassId && st.report === prev.report) return
    cancel?.()
    cancel = null
    const report = st.report
    const id = st.selectedPassId
    if (!report || !id || !tzReady()) return
    cancel = whenIdle(() => {
      cancel = null
      const pass = report.passes.find((x) => x.id === id)
      if (!pass) return
      const c = captureFor(report, pass)
      try {
        cachedPassModel(pass, report, timeZoneAt(report.place.lat, report.place.lon), location.host, !!c && isClouded(c))
      } catch {
        /* a warm-up only: the sheet builds it on open */
      }
    }, 3000)
  })
}
if (typeof window !== 'undefined') warmSelectedPass()

/** The week's share model, in the app's language (`locale`, the active one). */
function summaryModel(report: Report, tz: string, host: string, locale: Locale): ShareModel {
  const m = msgs(enShare)
  const label = publicLabelOf(report.place)
  const facts = summaryFacts(report, label, satMeta)
  return {
    title: m.titleWeek,
    spec: summaryCardSpec(report, label, satMeta, tz, host, locale),
    text: summaryPostText({ placeLabel: label, satellites: facts.satellites, photos: facts.counts.imaged, archiveDown: facts.archiveDown, partial: facts.partial }),
    fileName: m.weekPngName(slug(label), new Date(report.windowEnd).toISOString().slice(0, 10)),
    fallbackUrl: summaryLink(origin(), facts, locale),
  }
}

/** The share rows' column weights while every label has room in its share (ShareSheet.module.css). */
const ACTION_WEIGHTS = [1.4, 1, 1]
const SECONDARY_WEIGHTS = [1, 1, 1]
/** The least room a label keeps from its border (the CSS padding: it shows only once a label is that tight). */
const PAD_LEAST = { actions: 4, secondary: 6 }
/** What a row needs per side before its buttons share one line when the weighted shares are too tight for a label. */
const PAD_EVEN = 12

/**
 * A row of share buttons that fits its labels, whatever the language (CSS `data-fit` on the row):
 *   none      the weighted columns (Post to X wider than Copy link and Copy image) while every label fits its share
 *   'even'    one line still, each button its label plus an equal part of what is left, when a share is too narrow
 *   'stack'   the first button on a line of its own over the other two, in halves (1 + 2), when one line cannot
 *             give each label PAD_EVEN a side
 *   'stack-even'  the same, the two sized as 'even' is, when a half is too narrow for one of them
 *   'column'  a line each, when even the last two cannot share one
 * Three weighted buttons on a phone are ~99 px, and "Copier l’image", "Bild kopieren", "Görüntüyü kopyala" ran past
 * their borders. CSS cannot tell when labels no longer fit, so the row measures them: on a width change, a language
 * change and once the fonts are in, never when a label flashes "Copied" (that would move the buttons under the finger
 * that pressed one). Written to the DOM: nothing renders for it.
 */
function useFitRow(locale: Locale, weights: readonly number[], padLeast: number) {
  const stop = useRef<(() => void) | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- locale: a new callback re-measures in the new language
  return useCallback((row: HTMLElement | null) => {
    stop.current?.()
    stop.current = null
    if (!row) return
    let width = -1
    let live = true
    const check = (force = false) => {
      const w = row.clientWidth
      if (!live || !w || (w === width && !force)) return
      width = w
      const labels = ([...row.children] as HTMLElement[]).map(labelWidth)
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0
      const free = w - gap * (labels.length - 1)
      const total = weights.slice(0, labels.length).reduce((a, b) => a + b, 0)
      // Whether these labels share one line with `pad` a side (and the 1 px borders).
      const line = (ls: number[], pad: number) => ls.reduce((sum, x) => sum + x + 2 * pad + 2, gap * (ls.length - 1)) <= w + 0.5
      const rest = labels.slice(1)
      const half = (w - gap) / 2
      const fit = labels.every((x, i) => x + 2 * padLeast + 2 <= (free * (weights[i] ?? 1)) / total + 0.5)
        ? undefined
        : line(labels, PAD_EVEN)
          ? 'even'
          : rest.every((x) => x + 2 * PAD_EVEN + 2 <= half + 0.5)
            ? 'stack'
            : line(rest, PAD_EVEN)
              ? 'stack-even'
              : 'column'
      if (fit) row.dataset.fit = fit
      else delete row.dataset.fit
    }
    check(true)
    void document.fonts?.ready.then(() => check(true))
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => check())
    ro?.observe(row)
    stop.current = () => {
      live = false
      ro?.disconnect()
    }
  }, [locale])
}

/** A button's label at its own length (a nowrap line: the glyph and the words), without the padding and border. */
function labelWidth(el: HTMLElement): number {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect().width
}

/**
 * The overlay contract (R3-16): `document.documentElement.dataset.overlay = 'share'` while `on`; an overlay that was
 * already up (the lightbox) gets its value back when this one goes.
 */
function useOverlayAttr(on: boolean) {
  useLayoutEffect(() => {
    if (!on) return
    const root = document.documentElement
    const prev = root.dataset.overlay
    root.dataset.overlay = 'share'
    return () => {
      if (root.dataset.overlay !== 'share') return
      if (prev && prev !== 'share') root.dataset.overlay = prev
      else delete root.dataset.overlay
    }
  }, [on])
}

/**
 * The sheet once the card's headline measure is in (./measure.ts: fetched ahead of the press, so normally at once and
 * in the press's own commit). A press before it opens the sheet as soon as it arrives: the card is built only then,
 * so its preview is final at its first paint. Meanwhile the press already holds the share layer for Back and Esc
 * (either drops it, as either would close the sheet), and the sheet takes the layer over in the commit that mounts
 * it, so the history moves exactly as when it opened at once. A failed download drops the press (the Share button
 * stays live: the next press asks again).
 */
export function ShareSheet(props: ShareSheetProps) {
  const [ready, setReady] = useState(cardMeasureReady)
  const { onClose } = props
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (ready) return
    let alive = true
    loadCardMeasure().then(
      () => alive && setReady(true),
      () => alive && closeRef.current(),
    )
    return () => {
      alive = false
    }
  }, [ready])
  return ready ? <SheetBody {...props} /> : <SheetPending onClose={onClose} />
}

/**
 * A press while the measure downloads: nothing on screen yet, but Back and Esc already close it as the sheet's would.
 * Whatever the person does next drops it too (a tap anywhere, About): a sheet that arrived later would open over what
 * they turned to (over About, which must stay on top: drawn later, the sheet would cover it and take its Esc).
 */
function SheetPending({ onClose }: { onClose: () => void }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const close = () => closeRef.current()
  useBackLayer('share', true, close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // About over the results takes the Esc itself, as it does over the sheet.
      if (e.key !== 'Escape' || useApp.getState().aboutOpen) return
      e.stopPropagation()
      e.preventDefault()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    // Registered after the press's own pointerdown: only a later one drops it.
    window.addEventListener('pointerdown', close, true)
    const unsub = useApp.subscribe((s) => s.aboutOpen && close())
    if (useApp.getState().aboutOpen) close()
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', close, true)
      unsub()
    }
  }, [])
  return null
}

function SheetBody({ pass, report, onClose, clouded, kind = 'pass', from }: ShareSheetProps) {
  const m = useMsgs(enShare)
  // What is shared is in the app's language: a switch while the sheet is open rebuilds the model in the new one.
  const locale = useLocale()
  const place = report.place
  // The card prints the place's own zone ("EST"), so make sure the zone table is in (it normally is
  // by the time a report exists; a cold deep link may still be loading it).
  const [tzLoaded, setTzLoaded] = useState(tzReady)
  useEffect(() => {
    if (tzLoaded) return
    let live = true
    void ensureTz().then(() => live && setTzLoaded(tzReady()))
    return () => {
      live = false
    }
  }, [tzLoaded])
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tzLoaded: re-resolve once the table is in
  const tz = useMemo(() => timeZoneAt(place.lat, place.lon), [place.lat, place.lon, tzLoaded])
  const host = typeof location !== 'undefined' ? location.host : 'www.watched.earth'
  const summary = kind === 'summary' || !pass
  const model = useMemo(
    () => (summary || !pass ? summaryModel(report, tz, host, locale) : cachedPassModel(pass, report, tz, host, clouded)),
    [summary, pass, report, tz, host, clouded, locale],
  )
  const { spec, text, fileName, input, fallbackUrl } = model
  const stacked = useIsMobile()
  // Phones and portrait tablets: the sheet and its scrim cover the globe, which can rest meanwhile.
  useOverlayAttr(stacked)
  useEffect(() => track('share_open', { kind: summary ? 'summary' : 'pass', norad: summary ? undefined : pass?.norad, from }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const coarse = useMediaQuery(COARSE_QUERY)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const nativeFirst = coarse && canNativeShare
  const [shareFiles] = useState(canShareFiles)
  const [copyImageOk] = useState(canCopyImage)
  const fitActions = useFitRow(locale, ACTION_WEIGHTS, PAD_LEAST.actions)
  const fitSecondary = useFitRow(locale, SECONDARY_WEIGHTS, PAD_LEAST.secondary)

  const [link, setLink] = useState<LinkState>({ kind: 'idle' })
  const [flash, setFlash] = useState<Flash>(null)
  const [png, setPng] = useState<'busy' | 'ready' | 'err'>('busy')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const alive = useRef(true)

  // ── link: made on the first share action, never on open ─────────────────────────────────
  const linkPromise = useRef<Promise<string> | null>(null)
  const linkNow = useRef<string | null>(null)
  const resolveLink = useCallback(
    (id: Promise<string | null>) => {
      const p = id.then((v) => {
        const url = v ? shareLink(origin(), v, locale) : fallbackUrl
        linkNow.current = url
        if (alive.current) setLink({ kind: 'ready', url, short: !!v })
        return url
      })
      linkPromise.current = p
      return p
    },
    [fallbackUrl, locale],
  )
  /** The link to share: creates the share on first call (idempotent per pass for the session). */
  const ensureLink = useCallback((): Promise<string> => {
    if (linkPromise.current) return linkPromise.current
    if (!input) return Promise.resolve(fallbackUrl)
    setLink({ kind: 'pending' })
    return resolveLink(createShareSafe(input))
  }, [input, fallbackUrl, resolveLink])

  // Reopening the sheet for a pass already shared this session shows that link straight away. A
  // summary's link is known from the start (it stores nothing).
  useEffect(() => {
    alive.current = true
    linkPromise.current = null
    linkNow.current = null
    if (!input) {
      linkNow.current = fallbackUrl
      linkPromise.current = Promise.resolve(fallbackUrl)
      setLink({ kind: 'ready', url: fallbackUrl, short: false })
    } else {
      const prior = peekShare(input)
      setLink(prior ? { kind: 'pending' } : { kind: 'idle' })
      if (prior) void resolveLink(prior)
    }
    return () => {
      alive.current = false
    }
  }, [input, fallbackUrl, resolveLink])

  // ── the PNG: rendered locally on open (no network write), kept ready for a synchronous share ──
  const job = useRef<PngJob | null>(null)
  const startPng = useCallback((): PngJob => {
    if (job.current) return job.current
    const j: PngJob = { promise: renderCardPng(spec) }
    job.current = j
    j.promise.then(
      (blob) => {
        j.blob = blob
        j.file = new File([blob], fileName, { type: 'image/png' })
        if (alive.current && job.current === j) setPng('ready')
      },
      () => {
        if (alive.current && job.current === j) setPng('err')
      },
    )
    return j
  }, [spec, fileName])
  useEffect(() => {
    job.current = null
    setPng('busy')
    return whenIdle(() => void startPng(), PNG_IDLE_TIMEOUT_MS)
  }, [startPng])
  // The phone's primary waits this long for the PNG, then offers the link alone.
  const [patient, setPatient] = useState(true)
  useEffect(() => {
    setPatient(true)
    const t = window.setTimeout(() => setPatient(false), PNG_PATIENCE_MS)
    return () => window.clearTimeout(t)
  }, [startPng])

  // ── focus in, Esc out ───────────────────────────────────────────────────────────────────
  // Capture phase: the app's own Esc handler must not also deselect the pass. `onClose` is read from
  // a ref so a parent re-render (a fresh inline callback) never re-runs this and steals focus.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // The back gesture closes the sheet (src/lib/backStack.ts).
  useBackLayer('share', true, () => closeRef.current())
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    rootRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // About over the sheet takes the Esc itself (F3): only the top layer closes.
        if (useApp.getState().aboutOpen) return
        e.stopPropagation()
        e.preventDefault()
        closeRef.current()
      } else if (e.key === 'Tab') trapFocus(e, rootRef.current)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prev?.focus?.({ preventScroll: true })
    }
  }, [])

  // ── close as smoothly as it opened (SH5) ────────────────────────────────────────────────
  // The frozen clone keeps the last frame: the scrim fades, the dialog drops 8px and fades (wide) or the
  // sheet slides down from wherever the finger left it (stacked). Reduced motion: a 200 ms fade.
  useExitClone(rootRef, {
    keyframes: stacked ? [{ opacity: 1 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
    duration: stacked ? 280 : DUR.exit,
    easing: EASE.inOut,
    onStart: (clone, reduced) => {
      if (reduced) return
      const panel = clone.querySelector<HTMLElement>('[data-share-panel]')
      if (stacked) {
        clone.querySelector<HTMLElement>(`.${s.scrim}`)?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR.exit, easing: EASE.inOut, fill: 'forwards' })
        // A swipe-down dismiss leaves the sheet below its (single) snap, still moving: carry that motion
        // on with ease-out (the rule for anything already moving) instead of restarting from rest, which would stall
        // it under the finger for a few frames. The target lies a quarter beyond the bottom edge, so the
        // on-screen part leaves in the fast first half and the slow tail happens out of sight.
        // From rest (close button, Esc, scrim): ease-in-out, the full height.
        const sheet = panel?.querySelector<HTMLElement>('section')
        const dragged = /translate3d\(0px?, ([\d.]+)px/.exec(sheet?.style.transform ?? '')
        if (sheet && dragged && Number(dragged[1]) > 1) {
          const off = Math.max(0, window.innerHeight - sheet.getBoundingClientRect().top)
          panel?.animate([{ translate: '0 0' }, { translate: `0 ${Math.ceil(off * 1.25 + 8)}px` }], { duration: DUR.exit, easing: EASE.out, fill: 'forwards' })
        } else panel?.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 280, easing: EASE.inOut, fill: 'forwards' })
      } else {
        panel?.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(8px)', opacity: 0 },
          ],
          { duration: 200, easing: EASE.inOut, fill: 'forwards' },
        )
      }
    },
  })

  const showFlash = (f: Flash) => {
    if (!alive.current) return
    setFlash(f)
    window.setTimeout(() => alive.current && setFlash((cur) => (cur === f ? null : cur)), 2000)
  }

  // ── actions ─────────────────────────────────────────────────────────────────────────────
  const copy = async (tracked: unknown = true) => {
    if (tracked !== false) track('share_action', { action: 'copy_link', norad: summary ? undefined : pass?.norad, from })
    const pending = ensureLink()
    let ok = false
    if (linkNow.current) ok = await writeText(linkNow.current)
    else {
      // Safari only allows a clipboard write inside the gesture, so hand it a promise of the text.
      try {
        if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('no ClipboardItem')
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': pending.then((u) => new Blob([u], { type: 'text/plain' })) })])
        ok = true
      } catch {
        ok = await writeText(await pending)
      }
    }
    if (!ok) {
      // Last resort: select the field so the person can copy it themselves.
      await pending
      inputRef.current?.focus()
      inputRef.current?.select()
      ok = document.execCommand?.('copy') ?? false
    }
    if (ok) showFlash('link')
  }

  const post = () => {
    track('share_action', { action: 'x', norad: summary ? undefined : pass?.norad, from })
    if (linkNow.current) {
      window.open(xIntentUrl(text, linkNow.current), '_blank', `noopener,noreferrer,${X_POPUP}`)
      return
    }
    // Open the window inside the click (popup blockers), then point it at the intent once the link exists.
    const w = window.open('', '_blank', X_POPUP)
    void ensureLink().then((url) => {
      const target = xIntentUrl(text, url)
      if (w && !w.closed) {
        try {
          w.opener = null
        } catch {
          /* cross-origin already: nothing to sever */
        }
        w.location.href = target
      } else window.open(target, '_blank', `noopener,noreferrer,${X_POPUP}`)
    })
  }

  const download = async (tracked: unknown = true) => {
    if (tracked !== false) track('share_action', { action: 'save_png', norad: summary ? undefined : pass?.norad, from })
    try {
      const blob = await startPng().promise
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch {
      if (alive.current) setPng('err')
    }
  }

  /** Desktop: the card on the clipboard, to paste into a post as native media. */
  const copyImage = async () => {
    track('share_action', { action: 'copy_image', norad: summary ? undefined : pass?.norad, from })
    const j = startPng()
    try {
      // A Blob if it's ready, else the promise (Safari wants the ClipboardItem inside the gesture).
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': j.blob ?? j.promise })])
      showFlash('image')
    } catch {
      void download(false) // the same press, falling back: not a second share
    }
  }

  // The phone's primary: the image once it's ready; until then (≤ 2.5 s) an inert "Preparing image…";
  // after that, or if the PNG failed, the text and link alone.
  const nativeMode: 'image' | 'preparing' | 'link' = !shareFiles ? 'link' : png === 'ready' ? 'image' : png === 'busy' && patient ? 'preparing' : 'link'
  const nativeLabel = nativeMode === 'image' ? m.shareImage : nativeMode === 'preparing' ? m.preparingImage : m.share

  /**
   * Phones: the system share sheet with the card attached. Called synchronously in the tap: no await
   * comes before navigator.share, or Safari treats the gesture as spent and refuses.
   */
  const nativeShare = () => {
    if (nativeMode === 'preparing') return // inert for a moment: the next tap carries the image
    track('share_action', { action: 'native', norad: summary ? undefined : pass?.norad, from })
    void ensureLink() // the short link for next time (and for Copy); this share uses what's ready now
    const j = startPng()
    const data: ShareData = { text, url: linkNow.current ?? fallbackUrl }
    if (j.file && shareFiles) data.files = [j.file]
    let p: Promise<void>
    try {
      p = navigator.share(data)
    } catch (err) {
      p = Promise.reject(err)
    }
    p.catch((err: unknown) => {
      const name = err instanceof Error || err instanceof DOMException ? err.name : ''
      if (name === 'AbortError') return // the person cancelled
      // NotAllowedError (gesture spent / blocked) or TypeError (data refused): put the link on the clipboard.
      void copy(false) // the same press, falling back: not a second share
    })
  }

  // Pressing any share action starts the link a beat before the click lands.
  const warm = () => void ensureLink()
  const url = link.kind === 'ready' ? link.url : ''
  // The link is the long fallback (the short /s/ link could not be made): the field says so on hover.
  const direct = link.kind === 'ready' && !link.short && !!input
  const pngLabel = png === 'err' ? m.tryAgain : m.savePng

  const actions = nativeFirst ? (
    <div className={s.actionsTouch}>
      <Button
        variant="primary"
        className={s.native}
        onClick={nativeShare}
        onPointerDown={() => {
          warm()
          void startPng() // a tap before the idle callback starts the card at once
        }}
        aria-disabled={nativeMode === 'preparing' ? 'true' : undefined}
        aria-live="polite"
        data-mode={nativeMode}
      >
        <Glyph name="share" size={14} />
        {nativeLabel}
      </Button>
      <div ref={fitSecondary} className={s.secondary}>
        <Button onClick={copy} onPointerDown={warm} aria-live="polite">
          {flash === 'link' ? m.copied : m.copyLink}
        </Button>
        <Button onClick={post} onPointerDown={warm}>
          {m.postToX}
        </Button>
        <Button onClick={download}>{pngLabel}</Button>
      </div>
    </div>
  ) : (
    <div ref={fitActions} className={s.actions}>
      <Button variant="primary" onClick={post} onPointerDown={warm}>
        {m.postToX}
      </Button>
      <Button onClick={copy} onPointerDown={warm} aria-live="polite">
        {flash === 'link' ? <Glyph name="imaged" size={10} color="var(--signal)" /> : null}
        {flash === 'link' ? m.copied : m.copyLinkDesktop}
      </Button>
      {copyImageOk ? (
        <Button onClick={copyImage} onPointerDown={() => void startPng()} aria-live="polite">
          {flash === 'image' ? <Glyph name="imaged" size={10} color="var(--signal)" /> : null}
          {flash === 'image' ? m.copied : m.copyImage}
        </Button>
      ) : (
        <Button onClick={download}>{pngLabel}</Button>
      )}
    </div>
  )

  const body = (
    <div className={s.content}>
      <ShareCard spec={spec} />
      {actions}
      {/* Always laid out (R3 share): the row appearing on the first press re-centred the dialog (and grew the
          phone sheet) under the pointer, by 20–27 px, so the click landed beside the button and was lost. */}
      <div className={s.linkRow} data-link={link.kind}>
        <label htmlFor="share-link" className={s.linkLabel}>
          <span>{m.linkLabel}</span>
          <span className={s.labelGhost} aria-hidden>
            {m.postLabel}
          </span>
        </label>
        <input
          id="share-link"
          ref={inputRef}
          className={cx(s.link, link.kind !== 'ready' && s.linkPending)}
          // The long fallback link (the short /s/ link couldn't be made) says so on hover, not in a label that
          // would change width and slide the field sideways.
          title={direct ? m.directLink : undefined}
          readOnly
          value={link.kind === 'ready' ? url : link.kind === 'pending' ? m.creatingLink : m.linkLater}
          onFocus={(e) => link.kind === 'ready' && e.currentTarget.select()}
        />
      </div>
      <p className={s.text}>
        <span className={s.textLabel}>
          <span>{m.postLabel}</span>
          <span className={s.labelGhost} aria-hidden>
            {m.linkLabel}
          </span>
        </span>
        {/* Paragraphs as the post will have them (a blank line on X), set a little tighter here. */}
        <span className={s.textBody}>
          {text.split('\n\n').map((para, i) => (
            <span key={i}>{isolateHandles(para)}</span>
          ))}
        </span>
      </p>
      {/* The foot holds what is left to say or do: a card that could not be rendered, a download where there is no
          share button for the image. Nothing else (owner: no privacy paragraph here; README "Data" says it). */}
      {png === 'err' || (!nativeFirst && copyImageOk) ? (
        <div className={s.foot}>
          {png === 'err' ? <p className={s.privacy}>{m.renderFailed}</p> : null}
          {!nativeFirst && copyImageOk ? (
            <button type="button" className={s.textAction} onClick={download}>
              <Glyph name="download" size={12} />
              {pngLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  const title = <span id="share-title">{model.title}</span>

  return (
    <div ref={rootRef} className={s.root} role="dialog" aria-modal="true" aria-labelledby="share-title" tabIndex={-1} data-png={png}>
      <div className={s.scrim} onMouseDown={onClose} aria-hidden />
      {stacked ? (
        <StackedShare onClose={onClose} title={title} label={model.title} closeLabel={m.close}>
          {body}
        </StackedShare>
      ) : (
        <div className={s.dialog} data-share-panel>
          <div className={s.head}>
            <Rule className={s.rule}>{title}</Rule>
            <button type="button" className={s.close} onClick={onClose} aria-label={m.close} title={m.closeTitle}>
              <Glyph name="close" size={14} />
            </button>
          </div>
          {body}
        </div>
      )}
    </div>
  )
}

/**
 * The stacked dialog: the shell's bottom Sheet with one snap, measured to the content (capped by the
 * Sheet below the HUD band). The grip and a swipe down close it; the body scrolls if it can't all fit.
 */
function StackedShare({
  onClose,
  title,
  label,
  closeLabel,
  children,
}: {
  onClose: () => void
  title: React.ReactNode
  label: string
  closeLabel: string
  children: React.ReactNode
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0)
  useLayoutEffect(() => {
    const body = bodyRef.current
    const content = body?.firstElementChild as HTMLElement | null
    const section = body?.parentElement
    if (!body || !content || !section) return
    const measure = () => {
      const cs = getComputedStyle(body)
      const chrome = section.offsetHeight - body.offsetHeight
      const need = chrome + parseFloat(cs.paddingTop) + content.offsetHeight + parseFloat(cs.paddingBottom)
      setFit(Math.ceil(need))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(content)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={s.stacked} data-share-panel>
      <Sheet
        label={label}
        header={<Rule className={s.rule}>{title}</Rule>}
        // Start low and rise to the measured height: the first frame never overshoots the content.
        snaps={[fit || 0.4]}
        onClose={onClose}
        closeLabel={closeLabel}
        dismissible
        className={s.sheet}
        bodyRef={bodyRef}
      >
        {children}
      </Sheet>
    </div>
  )
}

async function writeText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function trapFocus(e: KeyboardEvent, root: HTMLElement | null) {
  if (!root) return
  const items = [...root.querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])')]
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
