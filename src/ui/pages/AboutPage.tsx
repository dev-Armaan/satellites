/**
 * <AboutPage onClose/>: "How this works": the short answers, the method, the limits, privacy and
 * credits, as a full-height scrollable overlay in the instrument language. A modal dialog: focus moves
 * in and is trapped, Esc / the close control leave, focus returns to where it was. The section index
 * on the left tracks the reading position. The copy is the owner's (short, plain, no em dashes).
 *
 * Motion: an ink curtain. Opening, it drops from the top (360 ms ease-in-out) and the title wipes in
 * under it; closing, the text clears (120 ms) and the curtain lifts away downward (480 ms), on a
 * frozen copy that keeps the reading position. Reduced motion: 160 ms fades.
 *
 * First frame: the sections lay out only as they come near the viewport (content-visibility, in the
 * stylesheet), so opening costs the intro, not the whole page. A jump from the index re-aims once the
 * scroll settles, since sections it passed may have grown or shrunk from their placeholder height.
 *
 * Copy: the 'about' namespace (src/i18n/en/about.ts). Paragraphs with a link or a mono number are rich parts, rendered
 * here (AboutText) into the same elements the page always had. The data licences' attribution lines stay in English
 * on purpose (docs/I18N.md), as do product names, the maker's handle and key symbols.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import { isAccent, isNum, isStrong, numText } from '../../../api/_lib/i18n/parts'
import { Rich } from '@/i18n/Rich'
import enAbout, { type AboutPart, type LinkPart } from '@/i18n/en/about'
import enVerdicts from '@/i18n/en/verdicts'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { useBackLayer } from '@/lib/backStack'
import { DUR, EASE } from '@/lib/ease'
import { useApp } from '@/state/store'
import { Bezel, Glyph, Kbd, Reveal, cx, useExitClone, Wordmark } from '@/ui/system'
// Only the vocabulary table (plain data, type-only imports), not the results UI: this chunk stays small.
import { VERDICTS, VERDICT_GLYPH } from '@/ui/results/lib/meta'
import { VERSION } from '@/ui/hud/Hud'
import { useCatalogStatus } from '@/ui/hud/catalogStatus'
import { fmtStampZ } from '@/ui/hud/readouts'
import s from './AboutPage.module.css'

/** The sections in order; their titles are the 'about' namespace's `sections` (the index and each heading). */
const SECTIONS = [
  { id: 'short', index: '00' },
  { id: 'method', index: '01' },
  { id: 'words', index: '02' },
  { id: 'accuracy', index: '03' },
  { id: 'privacy', index: '04' },
  { id: 'credits', index: '05' },
  { id: 'keys', index: '06' },
] as const

/** The maker (credits and footer). */
const MAKER_HANDLE = '@armaangupt0'
const MAKER_URL = 'https://x.com/armaangupt0'
const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/'

type SectionId = (typeof SECTIONS)[number]['id']
type Messages = typeof enAbout

/** A jumped-to section's top lands this far below the top of the reading area. */
const JUMP_MARGIN = 32
/** A jump that lands further than this from its target is re-aimed once. */
const JUMP_TOLERANCE = 8

/**
 * Calls `done` once `el` has stopped scrolling (scrollend where supported; else a few still frames),
 * on the frame after. Not at all if the reader takes over the scroll first (wheel, touch, keys).
 */
function afterScroll(el: HTMLElement, done: () => void) {
  let finished = false
  let raf = 0
  let last = -1
  let still = 0
  const takeOver = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
  const stop = () => {
    finished = true
    el.removeEventListener('scrollend', finish)
    takeOver.forEach((t) => el.removeEventListener(t, stop))
    cancelAnimationFrame(raf)
    window.clearTimeout(cap)
  }
  const finish = () => {
    if (finished) return
    stop()
    // Check on the next frame, once the sections the scroll reached have laid out.
    requestAnimationFrame(done)
  }
  el.addEventListener('scrollend', finish, { once: true })
  takeOver.forEach((t) => el.addEventListener(t, stop, { once: true, passive: true }))
  const poll = () => {
    const y = el.scrollTop
    still = y === last ? still + 1 : 0
    last = y
    if (still >= 3) finish()
    else raf = requestAnimationFrame(poll)
  }
  raf = requestAnimationFrame(poll)
  const cap = window.setTimeout(finish, 2000)
}

/** Copernicus attribution year(s): the 7-day window can straddle New Year. */
function copernicusYears(now = Date.now()): string {
  const y1 = new Date(now).getUTCFullYear()
  const y0 = new Date(now - 7 * 86_400_000).getUTCFullYear()
  return y0 === y1 ? String(y1) : `${y0}–${y1}`
}

export function AboutPage({ onClose }: { onClose: () => void }) {
  const m = useMsgs(enAbout)
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [current, setCurrent] = useState<SectionId>(SECTIONS[0].id)
  const catalog = useCatalogStatus()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // The back gesture closes About (src/lib/backStack.ts).
  useBackLayer('about', true, () => onCloseRef.current())

  // Focus in on open, back out on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    // Focus the scrolling region (not the close button): no focus ring shouts on open, and the
    // arrow / Page keys scroll right away. Tab reaches the close button next.
    scrollRef.current?.focus({ preventScroll: true })
    return () => {
      if (prev && prev.isConnected) prev.focus({ preventScroll: true })
    }
  }, [])

  // A modal owns the keyboard. Listening on window in the capture phase, before anything else:
  //  - Esc and "?" close it (the app's own "?" toggle never sees the key);
  //  - Tab stays inside the dialog;
  //  - every other key stops here, so the app's shortcuts behind it (←/→ step passes, Space plays a
  //    replay, "/" searches) don't act on a screen you can't see. Default actions are untouched:
  //    Space, arrows and Page keys still scroll the page, Enter still presses a focused button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')
      if (e.key === 'Escape' || (e.key === '?' && !typing)) {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') {
        e.stopPropagation()
        return
      }
      e.stopPropagation()
      if (!rootRef.current) return
      const focusables = [...rootRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.offsetParent !== null,
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      } else if (!rootRef.current.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Track which section is being read (the one crossing the upper third of the viewport).
  useEffect(() => {
    const root = scrollRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    // The last sections can't reach the reading band: at the end of the page, the last one is current
    // (also when the observer reports after the scroll event that got there, e.g. a jump to "Keys").
    const atEnd = () => root.scrollTop + root.clientHeight >= root.scrollHeight - 8
    // (The last one shown: touch-only devices have no "Keyboard" section.)
    const shown = [...root.querySelectorAll<HTMLElement>('section[id^="about-"]')].filter((el) => getComputedStyle(el).display !== 'none')
    const last = (shown[shown.length - 1]?.id.replace('about-', '') ?? SECTIONS[SECTIONS.length - 1].id) as SectionId
    const io = new IntersectionObserver(
      (entries) => {
        if (atEnd()) return setCurrent(last)
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setCurrent(hit.target.id.replace('about-', '') as SectionId)
      },
      { root, rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )
    root.querySelectorAll('section[id^="about-"]').forEach((el) => io.observe(el))
    const onScroll = () => {
      if (atEnd()) setCurrent(last)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      root.removeEventListener('scroll', onScroll)
    }
  }, [])

  // The curtain's entrance holds heavy GPU work back until it has played.
  useEffect(() => {
    useApp.getState().holdMotion(400)
  }, [])

  // The overlay contract (R3-16): `document.documentElement.dataset.overlay = 'about'` while the page covers
  // the globe, so the globe can rest; gone as the curtain starts lifting (the globe draws a fresh frame for
  // it). An overlay that was already up (the lightbox) gets its value back.
  useLayoutEffect(() => {
    const root = document.documentElement
    const prev = root.dataset.overlay
    root.dataset.overlay = 'about'
    return () => {
      if (root.dataset.overlay !== 'about') return
      if (prev) root.dataset.overlay = prev
      else delete root.dataset.overlay
    }
  }, [])

  // Close: the text clears first (120 ms), then the curtain lifts away downward (480 ms).
  useExitClone(rootRef, {
    keyframes: [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }],
    duration: DUR.md,
    delay: 120,
    easing: EASE.inOut,
    reducedKeyframes: [{ opacity: 1 }, { opacity: 0 }],
    // The copy's sections have no remembered size yet: give each the live one's height, so the carried
    // scroll offset shows the same lines (and the sections out of view still skip layout).
    prepare: (clone) => {
      const live = rootRef.current?.querySelectorAll<HTMLElement>('section')
      clone.querySelectorAll<HTMLElement>('section').forEach((sec, i) => {
        const h = live?.[i]?.offsetHeight
        if (h) sec.style.containIntrinsicSize = `auto ${h}px`
      })
    },
    onStart: (clone, reduced) => {
      if (reduced) return
      clone.querySelectorAll<HTMLElement>('[data-about-content]').forEach((el) =>
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: EASE.inOut, fill: 'forwards' }),
      )
    },
  })

  const jump = (id: SectionId) => {
    const root = scrollRef.current
    const el = root?.querySelector<HTMLElement>(`#about-${id}`)
    if (!el || !root) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const target = () => Math.max(0, Math.min(el.offsetTop - JUMP_MARGIN, root.scrollHeight - root.clientHeight))
    root.scrollTo({ top: target(), behavior: reduce ? 'auto' : 'smooth' })
    // The sections it passed rendered on the way and replaced their placeholder heights: if that moved
    // the target, aim once more (from close by, so the correction is short).
    afterScroll(root, () => {
      const t = target()
      if (Math.abs(root.scrollTop - t) > JUMP_TOLERANCE) root.scrollTo({ top: t, behavior: reduce ? 'auto' : 'smooth' })
    })
  }

  const years = copernicusYears()
  // What separates two sentences in running text: a space, or nothing in Chinese and Japanese.
  const gap = LOCALE_INFO[useLocale()].sentenceGap

  return (
    <div ref={rootRef} className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="about-title">
      <header className={s.bar} data-about-content>
        <span className={s.barLabel}>
          <Wordmark height={16} className={s.wordmark} /> <span className={s.dim}>/ {m.bar}</span>
        </span>
        <button ref={closeRef} type="button" className={s.close} onClick={onClose} aria-label={m.close} aria-keyshortcuts="Escape">
          <span className={s.closeText}>{m.close}</span>
          <Kbd className={s.closeKbd}>{m.keyNames.esc}</Kbd>
          <Glyph name="close" size={14} />
        </button>
      </header>
      {/* The reading area sits inside the frame: under the bar, above the bezel's bottom hairline. */}
      <div ref={scrollRef} className={s.scroll} tabIndex={-1} data-about-content>
        <div className={s.grid}>
          <nav className={s.nav} aria-label={m.sectionsLabel}>
            <ol>
              {SECTIONS.map((sec) => (
                <li key={sec.id} className={sec.id === 'keys' ? s.keyboardOnly : undefined}>
                  <button
                    type="button"
                    className={cx(s.navItem, current === sec.id && s.navCurrent)}
                    aria-current={current === sec.id ? 'location' : undefined}
                    onClick={() => jump(sec.id)}
                  >
                    <span className={s.navIdx}>{sec.index}</span>
                    {m.sections[sec.id]}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <article className={s.article}>
            <header className={s.intro}>
              <h1 id="about-title" className={s.title}>
                {m.title.map((line, i) => (
                  <Reveal key={i} as="span" className={s.titleLine} delay={300 + 60 * i}>
                    <Rich parts={line} classes={{ accent: s.serif }} accentAs="em" />
                  </Reveal>
                ))}
              </h1>
              <Reveal as="p" className={s.lede} delay={500} duration={720}>
                {m.lede}
              </Reveal>
            </header>

            <Section id="short" index="00" title={m.sections.short}>
              <Facts rows={m.short} />
            </Section>

            <Section id="method" index="01" title={m.sections.method}>
              <p>
                <AboutText parts={m.method.orbits} href={CELESTRAK_URL} />
                {catalog.state === 'ready' ? (
                  <>
                    {gap}
                    <AboutText parts={m.method.loaded(catalog.count, fmtStampZ(catalog.fetchedAt))} />
                  </>
                ) : null}
              </p>
              <p>{m.method.sgp4}</p>
              <Facts rows={m.method.facts} />
              <p>{m.method.archives}</p>
              <Facts rows={m.method.photoFacts} />
            </Section>

            <Section id="words" index="02" title={m.sections.words}>
              <Terms more={m.verdictMore} gap={gap} />
            </Section>

            <Section id="accuracy" index="03" title={m.sections.accuracy}>
              <Facts rows={m.accuracy} />
            </Section>

            <Section id="privacy" index="04" title={m.sections.privacy}>
              <Facts rows={m.privacy} />
            </Section>

            <Section id="credits" index="05" title={m.sections.credits}>
              <ul className={s.credits}>
                <Credit who={m.credits.madeBy.who}>
                  <AboutText parts={m.credits.madeBy.text(MAKER_HANDLE)} href={MAKER_URL} />
                </Credit>
                {/* The data licences' attribution lines, in the wording they prescribe: English in every language, each its
                    own left-to-right island, or a right-to-left page puts the full stop at the line's start. */}
                <Credit who="Sentinel-1 / 2">
                  <bdi lang="en">Contains modified Copernicus Sentinel data {years}, processed by ESA.</bdi>
                </Credit>
                <Credit who="Landsat 8 / 9">
                  <bdi lang="en">Landsat imagery courtesy of the U.S. Geological Survey and NASA.</bdi>
                </Credit>
                <Credit who="NASA GIBS">{m.credits.gibs}</Credit>
                <Credit who="Meteosat">
                  <bdi lang="en">
                    Contains modified EUMETSAT Meteosat data {new Date().getUTCFullYear()}, from EUMETSAT’s map service.
                  </bdi>
                </Credit>
                <Credit who={m.credits.archives.who}>{m.credits.archives.text}</Credit>
                <Credit who={m.credits.orbits.who}>{m.credits.orbits.text}</Credit>
                <Credit who={m.credits.placeNames.who}>{m.credits.placeNames.text}</Credit>
                <Credit who={m.credits.textures.who}>{m.credits.textures.text}</Credit>
                <Credit who={m.credits.type.who}>{m.credits.type.text}</Credit>
              </ul>
            </Section>

            <Section id="keys" index="06" title={m.sections.keys} className={s.keyboardOnly}>
              <dl className={s.keys}>
                <Key k={['/']}>{m.keys.search}</Key>
                <Key k={['↑', '↓']}>{m.keys.suggestions}</Key>
                <Key k={[m.keyNames.enter]}>{m.keys.choose}</Key>
                <Key k={['←', '→']}>{m.keys.passes}</Key>
                <Key k={['←', '→']}>{m.keys.photos}</Key>
                <Key k={['F']}>{m.keys.expand}</Key>
                <Key k={['+', '−', '0']}>{m.keys.zoom}</Key>
                <Key k={[m.keyNames.space]}>{m.keys.play}</Key>
                <Key k={[m.keyNames.esc]}>{m.keys.back}</Key>
                <Key k={['?']}>{m.keys.help}</Key>
              </dl>
            </Section>

            <footer className={s.footer}>
              <span>
                <Wordmark height={14} className={s.wordmark} /> <span className={s.ver}>{VERSION}</span>
              </span>
              <span className={s.byline}>
                <span className={s.bySep} aria-hidden>
                  ·
                </span>
                <AboutText parts={m.builtBy(MAKER_HANDLE)} href={MAKER_URL} />
              </span>
              <span className={s.dim}>{m.footerNote}</span>
            </footer>
          </article>
        </div>
      </div>
      <Bezel className={s.bezel} />
    </div>
  )
}

function Section({ id, index, title, className, children }: { id: SectionId; index: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section id={`about-${id}`} className={cx(s.section, className)} aria-labelledby={`about-${id}-h`}>
      <div className={s.secRule} aria-hidden>
        <span className={s.secIdx}>{index}</span>
      </div>
      <h2 id={`about-${id}-h`} className={s.h2}>
        {title}
      </h2>
      <div className={s.prose}>{children}</div>
    </section>
  )
}

/** Question / answer rows, in the namespace's order, keyed by their ids. */
function Facts({ rows }: { rows: Record<string, { term: string; text: string }> }) {
  return (
    <dl className={s.facts}>
      {Object.entries(rows).map(([id, { term, text }]) => (
        <div key={id} className={s.fact}>
          <dt>{term}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * An About paragraph's rich parts as the page's own elements: text, mono numbers (s.num), and the paragraph's one
 * link (`href`, opened in a new tab).
 */
function AboutText({ parts, href }: { parts: readonly AboutPart[]; href?: string }): ReactNode {
  return parts.map((p, i) => <Fragment key={i}>{aboutPart(p, href)}</Fragment>)
}

const isLink = (p: AboutPart): p is LinkPart => typeof p === 'object' && 'link' in p

function aboutPart(p: AboutPart, href: string | undefined): ReactNode {
  if (typeof p === 'string') return p
  if (isLink(p))
    return (
      <a href={href} target="_blank" rel="noreferrer">
        <AboutText parts={p.link} />
      </a>
    )
  // data-num: a left-to-right island inside right-to-left prose (scripts.css), as Rich renders its numbers.
  if (isNum(p))
    return (
      <span className={s.num} data-num="">
        {numText(p)}
      </span>
    )
  if (isAccent(p)) return <AboutText parts={p.accent} />
  if (isStrong(p)) return <AboutText parts={p.strong} />
  return null
}

/**
 * About's longer word on each verdict (`more`), after the one-sentence definition. The names and definitions come
 * from the product's one vocabulary (the 'verdicts' namespace, DESIGN §7), read here at render in the visitor's
 * language, so About always says what the results say.
 */
function Terms({ more, gap }: { more: Messages['verdictMore']; gap: string }) {
  const vm = useMsgs(enVerdicts)
  return (
    <dl className={s.terms}>
      {VERDICTS.map((v) => (
        <div key={v} className={s.term}>
          <dt>
            <span className={cx(s.termGlyph, v === 'imaged' && s.signal)}>
              <Glyph name={VERDICT_GLYPH[v]} size={14} />
            </span>
            {vm[v].title}
          </dt>
          <dd>
            {vm[v].definition}
            {more[v] ? `${gap}${more[v]}` : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Credit({ who, children }: { who: string; children: ReactNode }) {
  return (
    <li className={s.credit}>
      <span className={s.creditWho}>{who}</span>
      <span className={s.creditWhat}>{children}</span>
    </li>
  )
}

function Key({ k, children }: { k: string[]; children: ReactNode }) {
  return (
    <div className={s.key}>
      <dt>
        {k.map((x) => (
          <Kbd key={x}>{x}</Kbd>
        ))}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
