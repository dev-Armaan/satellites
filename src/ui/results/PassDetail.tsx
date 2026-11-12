/**
 * Pass detail.
 *
 *   PhotoPassView  a pass with a photo (owner B): the gallery (the same carousel as the summary hero, at the
 *                  column's width) stays mounted while you swipe; under it the pass's readouts, sentence,
 *                  01 / GEOMETRY and 02 / REPLAY change in place (a 160 ms fade) as the selection follows.
 *   PassDetail     a pass with no photo: the plan view, the same readouts and sections.
 *
 * Copy always uses Pass.tClosest, never Capture.datetime (Sentinel-2 archive times are the datatake start,
 * minutes before the satellite was over the place).
 *
 * Honest about cloud (decision #2): a mostly-cloud scene says so in its caption and its spot line, and a
 * near-total one is dimmed so it is never the brightest thing on screen.
 */
import { startTransition, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { isRadarUrl, isTonedUrl, spotCloud, tonedImageBlob } from '@/imagery'
import type { Capture, Pass, SpotCloud } from '@/types'
import { Glyph, Readout, Rule, ScrambleOnce, cx, fmtLon, fmtNorad, fmtUtc } from '@/ui/system'
import { reportNow } from './Ago'
import { decodedPhoto } from './images'
import { cardUrl } from './lib/photos'
import { Gallery } from './Gallery'
import { PassPlan } from './PassPlan'
import { ReplayControls } from './ReplayControls'
import { Paragraph } from './Text'
import { archiveName, cropSpec, downloadUrl, isDailyMosaic, isGeoFrame, isRadar, pixelLabel, slug, captureFor } from './lib/captures'
import { compassAbbr, dec1, dec2, int, passSentences } from './lib/copy'
import type { SatMeta } from './lib/meta'
import { replayWindow } from './lib/replay'
import { fmtDuration } from './lib/time'
import type { ResultsModel } from './model'
import r from './results.module.css'
import s from './PassDetail.module.css'

/** Stagger slot for the detail entrance (R14): ms delay as a CSS variable. */
const st = (ms: number) => ({ '--st': `${ms}ms` }) as CSSProperties

/** A pass older than this with no scene has no scene (not "archive lag"). */
const SCENE_LAG_MS = 48 * 3_600_000

/**
 * A pass with a photo. The gallery persists across quiet selections (swipes); the body below is keyed by the
 * pass and fades in place when the selection moves (the first one enters with the panel's own swap).
 */
export function PhotoPassView({ model, pass, mobile, onReplay }: { model: ResultsModel; pass: Pass; mobile: boolean; onReplay?: (p: Pass) => void }) {
  const first = useRef(pass.id)
  // The body follows the selection in a transition (interruptible, off the swipe's critical path, A3): a quiet
  // selection's synchronous work is the header, the footer and the gallery, never the whole body.
  const [bodyPass, setBodyPass] = useState(pass)
  useEffect(() => {
    if (pass.id !== bodyPass.id) startTransition(() => setBodyPass(pass))
  }, [pass, bodyPass.id])
  const shown = model.passById.get(bodyPass.id) ?? pass
  return (
    <div className={s.detail}>
      <section className={cx(r.section, s.st)} style={st(0)} aria-label="Photos">
        <Gallery model={model} context="detail" mobile={mobile} selectedId={pass.id} onReplay={onReplay} />
      </section>
      <PassBody key={shown.id} model={model} pass={shown} entering={first.current === shown.id} />
    </div>
  )
}

/** A pass with no photo: its plan view, then the same body. */
export function PassDetail({ model, pass }: { model: ResultsModel; pass: Pass }) {
  const meta = model.meta(pass.norad)
  const place = model.report.place
  const now = reportNow(model.clock)
  return (
    <div className={s.detail}>
      <section className={cx(r.section, s.st)} style={st(0)} aria-label="Plan view">
        <div data-image-end>
          <PassPlan pass={pass} meta={meta} lat={place.lat} lon={place.lon} className={s.plan} />
        </div>
        <p className={r.footnote}>{noImageNote(pass, meta, model.archiveFailed, now)}</p>
      </section>
      <PassBody model={model} pass={pass} entering />
    </div>
  )
}

/**
 * The pass's words and numbers: the readout strip, the sentence (+ the spot line, the blurb, the links),
 * 01 / GEOMETRY and 02 / REPLAY. `entering`: the staggered entrance of a freshly opened pass; otherwise (a
 * quiet selection from the gallery) one 160 ms fade of the block.
 */
function PassBody({ model, pass, entering }: { model: ResultsModel; pass: Pass; entering: boolean }) {
  const { report, tz } = model
  const meta = model.meta(pass.norad)
  const capture = captureFor(report, pass)
  const place = report.place
  const cloud = useSpotCloud(capture, place)
  const now = reportNow(model.clock)
  const sentences = passSentences({ pass, meta, capture, timeZone: tz, placeLabel: place.label, archiveFailed: model.archiveFailed, now })
  // PERF-04: the words commit first; geometry and replay a frame later, interruptibly.
  const [rest, setRest] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => startTransition(() => setRest(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const stc = entering ? s.st : undefined
  return (
    <div className={cx(s.body, !entering && s.quietIn)}>
      <section className={cx(r.section, stc)} style={st(0)}>
        <ReadoutStrip pass={pass} meta={meta} capture={capture} cloud={cloud} />
      </section>

      <section className={cx(r.section, stc, s.prose)} style={st(60)}>
        <Paragraph sentences={sentences} />
        {capture && !isDailyMosaic(capture) && !isRadar(capture) && !isGeoFrame(capture) ? <SpotLine state={cloud} /> : null}
        {capture && isGeoFrame(capture) ? (
          <p className={r.footnote}>
            A full-disc image: one picture of everything the satellite can see, at {pixelLabel(capture)} a pixel here. Coarse, but real, and the newest one
            published; it has taken one like it {meta.profile?.cadenceMin ? `every ${int(meta.profile.cadenceMin)} minutes` : 'every few minutes'} all week.
          </p>
        ) : null}
        {capture && isDailyMosaic(capture) ? (
          <p className={r.footnote}>
            A daily mosaic: NASA stitches each day’s swaths into one picture at {int(capture.gsdM)} m per pixel. Coarse, but real, and from this pass’s day.
          </p>
        ) : null}
        {capture && isRadar(capture) ? (
          <p className={r.footnote}>
            A radar image, not a photograph: Sentinel-1 sends out microwaves and records their echo, so cloud and darkness don’t stop it. Brightness is how
            strongly the ground sends them back: buildings and rough ground are bright, calm water is dark.
          </p>
        ) : null}
        {meta.profile?.blurb ? <p className={r.blurb}>{meta.profile.blurb}</p> : null}
        {capture ? <Links capture={capture} pass={pass} meta={meta} placeLabel={place.label} /> : null}
      </section>

      {rest ? (
        <>
          <section className={r.section} aria-label="Geometry">
            <div className={stc} style={st(120)}>
              <Rule index="01" className={r.rule}>
                Geometry
              </Rule>
            </div>
            <Geometry pass={pass} meta={meta} tz={tz} model={model} entering={entering} />
          </section>

          <section className={cx(r.section, stc)} style={st(300)} aria-label="Replay">
            <Rule index="02" className={r.rule}>
              Replay
            </Rule>
            <ReplayControls pass={pass} />
          </section>
        </>
      ) : null}
    </div>
  )
}

function noImageNote(p: Pass, meta: SatMeta, archiveFailed: boolean, now: number): string {
  switch (p.verdict) {
    case 'could':
      // The sentence below says what we can't know; this only says why there is no picture.
      if (meta.profile?.openArchive) return `No ${meta.name} image of this spot from this pass. Plan view of the pass.`
      return meta.category === 'radar'
        ? 'No public image: this radar operator’s archive is private. Plan view of the pass.'
        : 'No public image: commercial archives are private. Plan view of the pass.'
    case 'likely':
      if (meta.category !== 'open-optical') return 'No image to show for this pass. Plan view of the pass.'
      if (archiveFailed) return 'The archive could not be searched just now. Plan view of the pass.'
      if (now - p.tClosest > SCENE_LAG_MS) return 'No scene exists for this pass. Plan view of the pass.'
      return 'No published scene matches this pass yet. Sentinel-2 and Landsat scenes usually appear within a day.'
    case 'overhead':
      return 'Crewed stations carry cameras, but their photos are not published by place and time.'
    default:
      return 'The image for this pass is not available.'
  }
}

function Links({ capture, pass, meta, placeLabel }: { capture: Capture; pass: Pass; meta: SatMeta; placeLabel: string }) {
  const spec = cropSpec(capture.collection)
  const [dl, setDl] = useState<'idle' | 'busy' | 'err'>('idle')
  const download = async () => {
    if (dl === 'busy') return
    setDl('busy')
    const url = downloadUrl(capture, spec)
    try {
      // Sentinel-2 / Landsat: the lossless render, toned exactly like the photo on screen (same curve, PNG); a radar
      // image toned as on screen too.
      let blob: Blob
      if (isTonedUrl(url) || isRadarUrl(url)) blob = await tonedImageBlob(url, { fmt: 'png' })
      else {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        blob = await res.blob()
      }
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `watched-${slug(meta.name)}-${slug(placeLabel)}-${new Date(pass.tClosest).toISOString().slice(0, 10)}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setDl('idle')
    } catch {
      // The render could not be fetched as a file: offer it as a plain link instead (a window.open
      // here, after an await, would be popup-blocked).
      setDl('err')
    }
  }
  return (
    <div className={s.links}>
      {dl === 'err' ? (
        // The picture on screen (its toned bytes, a blob: URL) when the lossless render could not be fetched.
        <a className={s.link} href={decodedPhoto(cardUrl(capture))?.src ?? downloadUrl(capture, spec)} target="_blank" rel="noopener noreferrer">
          <Glyph name="arrow-up-right" size={12} />
          Open image to save it
        </a>
      ) : (
        <button type="button" className={s.link} onClick={download} disabled={dl === 'busy'}>
          <Glyph name="download" size={12} />
          {dl === 'busy' ? 'Downloading…' : 'Download image'}
        </button>
      )}
      {capture.sourceUrl ? (
        <a className={s.link} href={capture.sourceUrl} target="_blank" rel="noopener noreferrer">
          <Glyph name="arrow-up-right" size={12} />
          View source · {archiveName(capture)}
        </a>
      ) : null}
    </div>
  )
}

// ── readout strip (R23) ──────────────────────────────────────────────────────────────────

function ReadoutStrip({ pass: p, meta, capture, cloud }: { pass: Pass; meta: SatMeta; capture?: Capture; cloud: CloudState }) {
  const res = capture?.gsdM ?? meta.profile?.resolutionM
  const spot: SpotCloud | undefined = cloud === 'checking' || cloud === 'none' ? capture?.spot : cloud
  let last: { label: string; value: string; unit?: string }
  // A radar image needs no light: the sun is the fact worth showing (it may well have been night).
  if (capture && isGeoFrame(capture)) last = { label: 'Band', value: capture.band === 'infrared' ? 'Infrared' : capture.band === 'visible' ? 'Visible' : 'Colour' }
  else if (!capture || isRadar(capture)) last = { label: 'Sun', value: `${dec1(p.sunElevationDeg)}°`, unit: p.sunElevationDeg >= 0 ? 'day' : p.sunElevationDeg >= -6 ? 'twilight' : 'night' }
  else if (isDailyMosaic(capture)) last = { label: 'Cloud', value: '—', unit: 'mosaic' }
  else if (cloud === 'checking' && !capture.spot) last = { label: 'Cloud at spot', value: '…' }
  else if (spot && spot !== 'unknown')
    last = { label: 'Cloud at spot', value: spot === 'clear' ? 'Clear' : spot === 'cirrus' ? 'Cirrus' : spot === 'cloud' ? 'Cloud' : 'Shadow' }
  else last = { label: 'Cloud', value: capture.cloudCoverPct !== undefined ? `${int(capture.cloudCoverPct)}%` : '—', unit: capture.cloudCoverPct !== undefined ? 'scene' : undefined }
  const cells = [
    { label: 'Altitude', value: int(p.altitudeKm), unit: 'km' },
    // A geostationary imager is never overhead: how high it stands in your sky says more than its mirror's angle.
    p.geostationary ? { label: 'Elevation', value: `${dec1(p.elevationDeg)}°`, unit: 'up' } : { label: 'Off-nadir', value: `${dec1(p.offNadirDeg)}°` },
    res !== undefined && res >= 1000
      ? { label: 'Pixel', value: int(res / 1000), unit: 'km' }
      : { label: 'Pixel', value: res !== undefined ? (res < 1 ? dec2(res) : int(res)) : '—', unit: res !== undefined ? 'm' : undefined },
    last,
  ]
  return (
    <div className={s.strip}>
      {cells.map((c) => (
        <div key={c.label} className={s.stripCell}>
          <span className={s.stripLabel}>{c.label}</span>
          <span className={s.stripValue}>
            {c.value}
            {c.unit ? <span className={s.stripUnit}>{c.unit}</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── spot cloud ────────────────────────────────────────────────────────────────────────────

type CloudState = 'checking' | SpotCloud | 'none'

/** The classification at the place: the engine's (capture.spot) when it has one, else read it now. */
function useSpotCloud(capture: Capture | undefined, place: { lat: number; lon: number }): CloudState {
  const known = capture?.spot
  const [state, setState] = useState<CloudState>(() => known ?? 'none')
  useEffect(() => {
    if (!capture || isDailyMosaic(capture) || isRadar(capture) || isGeoFrame(capture)) return setState('none')
    if (capture.spot) return setState(capture.spot)
    const ctl = new AbortController()
    setState('checking')
    spotCloud(capture, place, ctl.signal)
      .then((v) => !ctl.signal.aborted && setState(v))
      .catch(() => !ctl.signal.aborted && setState('unknown'))
    return () => ctl.abort()
  }, [capture, place])
  return state
}

const SPOT_TEXT: Record<Exclude<CloudState, 'none' | 'unknown'>, string> = {
  checking: 'Reading the pixel at your spot…',
  clear: 'Clear over your spot.',
  cirrus: 'Thin cirrus flagged over your spot; it may soften the picture.',
  cloud: 'Cloud over your spot.',
  shadow: 'Your spot was in cloud shadow.',
}

function SpotLine({ state }: { state: CloudState }) {
  if (state === 'none' || state === 'unknown') return null
  return (
    <p className={cx(s.spot, state === 'checking' && s.spotChecking)} aria-live="polite">
      <span className={cx(s.spotMark, state === 'clear' && s.spotClear, state === 'cirrus' && s.spotCirrus)} aria-hidden />
      {SPOT_TEXT[state]}
    </p>
  )
}

// ── geometry ──────────────────────────────────────────────────────────────────────────────

function Geometry({ pass: p, meta, tz, model, entering }: { pass: Pass; meta: SatMeta; tz: string; model: ResultsModel; entering: boolean }) {
  const [utcDate, utcTime] = fmtUtc(p.tClosest).split(' ')
  const prof = meta.profile
  const w = replayWindow(p)
  const t = model.times(p)
  void tz
  if (p.geostationary) {
    // A scan, not an overflight: where the satellite sits, and how its line crossed the place (to about a minute).
    const [, startUtc] = fmtUtc(p.tStart).split(' ')
    const [, endUtc] = fmtUtc(p.tEnd).split(' ')
    const geoCells: { label: string; value: ReactNode; unit?: string; wide?: boolean }[] = [
      { label: 'Scan line here · UTC', value: `≈ ${utcTime.slice(0, 5)}`, unit: utcDate },
      { label: 'Scan line here · local', value: `≈ ${t.time}`, unit: `${t.day} ${t.zone}` },
      { label: 'Above the equator at', value: fmtLon(p.track[0]?.lon ?? 0, 1) },
      { label: 'In your sky', value: `${dec1(p.elevationDeg)}°`, unit: `up · ${compassAbbr(p.azimuthDeg)}` },
      { label: 'Scan direction', value: p.node === 'descending' ? 'North → south' : 'South → north' },
      { label: 'Line speed here', value: dec1(p.groundSpeedKmS), unit: 'km/s' },
      { label: 'Sun elevation', value: `${dec1(p.sunElevationDeg)}°`, unit: p.sunElevationDeg >= 0 ? 'Day' : p.sunElevationDeg >= -6 ? 'Twilight' : 'Night' },
      { label: 'Coverage', value: 'Full disc', unit: prof?.cadenceMin ? `every ${int(prof.cadenceMin)} min` : undefined },
      { label: 'This scan', value: `${startUtc.slice(0, 5)} → ${endUtc.slice(0, 5)}`, unit: `UTC · ${fmtDuration(p.tEnd - p.tStart)}`, wide: true },
      { label: 'NORAD · scan', value: <ScrambleOnce text={fmtNorad(p.norad)} />, unit: p.id, wide: true },
    ]
    return (
      <div className={r.grid}>
        {geoCells.map((c, i) => (
          <div key={c.label} className={cx(r.cell, c.wide && r.cellWide, entering && s.st)} style={st(Math.min(300, 120 + i * 20))}>
            <Readout label={c.label} value={c.value} unit={c.unit} />
          </div>
        ))}
      </div>
    )
  }
  const cells: { label: string; value: ReactNode; unit?: string; wide?: boolean }[] = [
    { label: 'Closest · UTC', value: utcTime, unit: utcDate },
    { label: 'Closest · local', value: t.timeS, unit: `${t.day} ${t.zone}` },
    { label: 'Ground distance', value: dec1(p.groundDistanceKm), unit: 'km' },
    { label: 'Elevation from you', value: `${dec1(p.elevationDeg)}°`, unit: compassAbbr(p.azimuthDeg) },
    { label: 'Ground speed', value: dec2(p.groundSpeedKmS), unit: 'km/s' },
    { label: 'Heading', value: `${dec1(p.headingDeg)}°`, unit: `${compassAbbr(p.headingDeg)} · ${p.node === 'ascending' ? 'Asc' : 'Desc'}` },
    { label: 'Sun elevation', value: `${dec1(p.sunElevationDeg)}°`, unit: p.sunElevationDeg >= 0 ? 'Day' : p.sunElevationDeg >= -6 ? 'Twilight' : 'Night' },
    prof?.maxOffNadirDeg
      ? { label: 'Field of regard', value: `±${int(prof.maxOffNadirDeg)}°` }
      : { label: 'Swath', value: prof?.swathKm ? int(prof.swathKm) : '—', unit: prof?.swathKm ? 'km' : undefined },
    {
      label: p.tEnd > p.tStart ? (p.inSwath ? 'In swath' : 'In view') : 'Window',
      value: p.tEnd > p.tStart ? `${fmtUtc(p.tStart).split(' ')[1]} → ${fmtUtc(p.tEnd).split(' ')[1]}` : `${fmtUtc(w[0]).split(' ')[1]} → ${fmtUtc(w[1]).split(' ')[1]}`,
      unit: p.tEnd > p.tStart ? fmtDuration(p.tEnd - p.tStart) : 'UTC',
      wide: true,
    },
    // The pass ID lives here, with the satellite's catalog number (not in the header: V05).
    { label: 'NORAD · pass', value: <ScrambleOnce text={fmtNorad(p.norad)} />, unit: p.id, wide: true },
  ]
  return (
    <div className={r.grid}>
      {cells.map((c, i) => (
        <div key={c.label} className={cx(r.cell, c.wide && r.cellWide, entering && s.st)} style={st(Math.min(300, 120 + i * 20))}>
          <Readout label={c.label} value={c.value} unit={c.unit} />
        </div>
      ))}
    </div>
  )
}
