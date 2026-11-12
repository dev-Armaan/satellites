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
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useBackLayer } from '@/lib/backStack'
import { DUR, EASE } from '@/lib/ease'
import { useApp } from '@/state/store'
import { Bezel, Glyph, Kbd, Reveal, cx, fmtInt, useExitClone, Wordmark } from '@/ui/system'
// Only the vocabulary table (plain data, type-only imports), not the results UI: this chunk stays small.
import { VERDICTS, VERDICT_GLYPH, VERDICT_META, type Verdict } from '@/ui/results/lib/meta'
import { VERSION } from '@/ui/hud/Hud'
import { useCatalogStatus } from '@/ui/hud/catalogStatus'
import { fmtStampZ } from '@/ui/hud/readouts'
import s from './AboutPage.module.css'

const SECTIONS = [
  { id: 'short', index: '00', title: 'The short version' },
  { id: 'method', index: '01', title: 'How we find the passes' },
  { id: 'words', index: '02', title: 'What the labels mean' },
  { id: 'accuracy', index: '03', title: 'What we can’t see' },
  { id: 'privacy', index: '04', title: 'Privacy' },
  { id: 'credits', index: '05', title: 'Credits' },
  { id: 'keys', index: '06', title: 'Keyboard' },
] as const

/** The maker (credits and footer). */
const MAKER_HANDLE = '@armaangupt0'
const MAKER_URL = 'https://x.com/armaangupt0'

type SectionId = (typeof SECTIONS)[number]['id']

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

  return (
    <div ref={rootRef} className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="about-title">
      <header className={s.bar} data-about-content>
        <span className={s.barLabel}>
          <Wordmark height={16} className={s.wordmark} /> <span className={s.dim}>/ About</span>
        </span>
        <button ref={closeRef} type="button" className={s.close} onClick={onClose} aria-label="Close" aria-keyshortcuts="Escape">
          <span className={s.closeText}>Close</span>
          <Kbd className={s.closeKbd}>Esc</Kbd>
          <Glyph name="close" size={14} />
        </button>
      </header>
      {/* The reading area sits inside the frame: under the bar, above the bezel's bottom hairline. */}
      <div ref={scrollRef} className={s.scroll} tabIndex={-1} data-about-content>
        <div className={s.grid}>
          <nav className={s.nav} aria-label="Sections">
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
                    {sec.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <article className={s.article}>
            <header className={s.intro}>
              <h1 id="about-title" className={s.title}>
                <Reveal as="span" className={s.titleLine} delay={300}>
                  How this
                </Reveal>
                <Reveal as="span" className={s.titleLine} delay={360}>
                  <em className={s.serif}>works</em>.
                </Reveal>
              </h1>
              <Reveal as="p" className={s.lede} delay={500} duration={720}>
                Pick a spot on Earth. We work out which satellites flew over it in the last week, then go find the photos they
                took. It all runs in your browser, on public data.
              </Reveal>
            </header>

            <Section id="short" index="00" title="The short version">
              <Facts
                rows={[
                  [
                    'Is it live?',
                    'Not quite. Photos land in the archives a few hours to a couple of days after they’re taken, so the newest passes might not have one yet.',
                  ],
                  ['Can it see me?', 'No. At best a pixel here is 10 m across. A car is one pixel. You’re not in it.'],
                  [
                    'Is this every satellite?',
                    'No. Military and spy satellites mostly aren’t in public catalogs, and companies don’t say where they point their cameras.',
                  ],
                ]}
              />
            </Section>

            <Section id="method" index="01" title="How we find the passes">
              <p>
                Every object in orbit has a public set of numbers that describes its path.{' '}
                <a href="https://celestrak.org/NORAD/elements/" target="_blank" rel="noreferrer">
                  CelesTrak
                </a>{' '}
                publishes them from US Space Force tracking, and we grab a fresh copy every six hours.
                {catalog.state === 'ready' ? (
                  <>
                    {' '}
                    This page loaded <span className={s.num}>{fmtInt(catalog.count)}</span> objects, fetched{' '}
                    <span className={s.num}>{fmtStampZ(catalog.fetchedAt)}</span>.
                  </>
                ) : null}
              </p>
              <p>
                We run each satellite through SGP4, the standard orbit model, for the past seven days and note every time your spot
                was inside what it could see.
              </p>
              <Facts
                rows={[
                  [
                    'Straight down',
                    'Sentinel-2 and Landsat look straight down at a strip of ground, about 290 km wide for Sentinel-2 and 185 km for Landsat. You have to be in the strip.',
                  ],
                  ['Tilting cameras', 'Lots of commercial satellites can lean 30 to 45 degrees. If you were in reach, we call it “could have pointed here”.'],
                  ['Daylight', 'Regular cameras need the sun. A pass in the dark never counts as a photo.'],
                  [
                    'Radar',
                    'Sentinel-1 doesn’t need the sun. It sends out microwaves and records the echo, so it sees through cloud and at night, looking off to one side of its track. Its images are public too, so we show them, in grey: bright is rough ground and buildings, dark is calm water.',
                  ],
                  [
                    'Weather satellites',
                    'A few sit over the equator and watch half the planet every 10 minutes. If you’re on their side of Earth, you’re in every frame.',
                  ],
                ]}
              />
              <p>
                Then we search the image archives (Microsoft Planetary Computer, Element 84 and NASA) and match each image to the
                pass that took it. Every image you see is the real one, cropped around your spot.
              </p>
              <Facts
                rows={[
                  [
                    'Touch-ups',
                    'Sentinel-2 and Landsat photos are colour-balanced, smoothed and lightly sharpened for your screen, the same way across the whole picture. Nothing is added or removed.',
                  ],
                  [
                    'Which way is up',
                    'Sentinel-2 and Landsat photos keep the archive’s own map grid for your place, so north can sit a few degrees off straight up. When you open a photo, its N arrow shows exactly where.',
                  ],
                ]}
              />
            </Section>

            <Section id="words" index="02" title="What the labels mean">
              <Terms />
            </Section>

            <Section id="accuracy" index="03" title="What we can’t see">
              <Facts
                rows={[
                  ['Exact positions', 'Public orbit data is good to about a kilometre and drifts a little each day. Times can be off by a few seconds.'],
                  ['Secret satellites', 'Some of the best cameras in orbit belong to militaries. They don’t show up here.'],
                  ['Clouds', 'Plenty of photos are just cloud. When the archive tells us, we check the exact pixel over your spot and say so.'],
                  ['Delays', 'Photos can take a day or two to show up.'],
                ]}
              />
            </Section>

            <Section id="privacy" index="04" title="Privacy">
              <Facts
                rows={[
                  ['Where it runs', 'The orbit maths happens in your browser.'],
                  ['What we keep', 'We count searches by town and a rough 10 km area, never your exact spot, and keep a tally of what gets opened and shared. No IP addresses, no cookies of our own, nothing that ties one visit to the next.'],
                  [
                    'Who else sees it',
                    'Most place names come from a list built into the site. Other searches go to Open-Meteo, Photon or Nominatim. Photos load straight from the archives. Our host counts page views and speed, without cookies, and may set one security cookie to tell people from bots. We never read it.',
                  ],
                  [
                    'Share links',
                    'Only made when you share something. Anyone with the link sees the place name, a spot rounded to about 1 km, and the pass you picked.',
                  ],
                ]}
              />
            </Section>

            <Section id="credits" index="05" title="Credits">
              <ul className={s.credits}>
                <Credit who="Made by">
                  Armaan,{' '}
                  <a href={MAKER_URL} target="_blank" rel="noreferrer">
                    {MAKER_HANDLE}
                  </a>{' '}
                  on X
                </Credit>
                <Credit who="Sentinel-1 / 2">Contains modified Copernicus Sentinel data {years}, processed by ESA.</Credit>
                <Credit who="Landsat 8 / 9">Landsat imagery courtesy of the U.S. Geological Survey and NASA.</Credit>
                <Credit who="NASA GIBS">Imagery from NASA’s GIBS, part of EOSDIS. GOES via NOAA and CIRA, Himawari via JMA.</Credit>
                <Credit who="Meteosat">Contains modified EUMETSAT Meteosat data {new Date().getUTCFullYear()}, from EUMETSAT’s map service.</Credit>
                <Credit who="Archives">Microsoft Planetary Computer and Element 84 Earth Search; Landsat’s 15 m band from the Copernicus Data Space Ecosystem.</Credit>
                <Credit who="Orbits">Element sets from CelesTrak. SGP4 by satellite.js.</Credit>
                <Credit who="Place names">Photon by komoot. Map data © OpenStreetMap contributors (ODbL).</Credit>
                <Credit who="Earth textures">Solar System Scope (CC BY 4.0), from NASA Blue Marble and Black Marble.</Credit>
                <Credit who="Type">Instrument Sans and Serif by Instrument, Martian Mono by Evil Martians (SIL OFL).</Credit>
              </ul>
            </Section>

            <Section id="keys" index="06" title="Keyboard" className={s.keyboardOnly}>
              <dl className={s.keys}>
                <Key k={['/']}>Search for a place</Key>
                <Key k={['↑', '↓']}>Move through suggestions</Key>
                <Key k={['Enter']}>Choose</Key>
                <Key k={['←', '→']}>Step through passes</Key>
                <Key k={['←', '→']}>Previous / next photo</Key>
                <Key k={['F']}>Expand the photo</Key>
                <Key k={['+', '−', '0']}>Zoom (when expanded)</Key>
                <Key k={['Space']}>Play or pause the replay</Key>
                <Key k={['Esc']}>Back, or close</Key>
                <Key k={['?']}>This page</Key>
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
                Built by{' '}
                <a href={MAKER_URL} target="_blank" rel="noreferrer">
                  {MAKER_HANDLE}
                </a>
              </span>
              <span className={s.dim}>Made from public data. We didn’t take any of these photos.</span>
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

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className={s.facts}>
      {rows.map(([k, v]) => (
        <div key={k} className={s.fact}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * About's longer word on each verdict, after the one-sentence definition. The names and definitions come
 * from the product's one vocabulary table (DESIGN §7), so About always says what the results say.
 */
const VERDICT_MORE: Record<Verdict, string> = {
  imaged: 'If we show it, it’s the actual photo.',
  likely: 'The photo isn’t public yet, or it got tossed because of clouds.',
  could: 'There’s no way to know if it actually did.',
  overhead: '',
}

function Terms() {
  return (
    <dl className={s.terms}>
      {VERDICTS.map((v) => (
        <div key={v} className={s.term}>
          <dt>
            <span className={cx(s.termGlyph, v === 'imaged' && s.signal)}>
              <Glyph name={VERDICT_GLYPH[v]} size={14} />
            </span>
            {VERDICT_META[v].title}
          </dt>
          <dd>
            {VERDICT_META[v].definition}
            {VERDICT_MORE[v] ? ` ${VERDICT_MORE[v]}` : null}
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
