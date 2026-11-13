/**
 * The time-lapse's way in from the results, and the layer that mounts its player.
 *
 * The row sits under the photos: one quiet line that says what it opens. It is offered only where Sentinel-2
 * has photographed the place (a Sentinel-2 capture in this report, or its last clear look): over open ocean there
 * is nothing to play, and a row that leads to "nothing here" is worse than no row.
 *
 * The player and the frame selection behind it are a chunk of their own, fetched the first time the time-lapse
 * is opened: a search that never opens it downloads and runs none of it. A hover or a touch on the row starts
 * the download, so a press usually finds it there.
 */
import { useEffect, useState, type ComponentType } from 'react'
import { useTimelapseUi } from '@/state/timelapse'
import { Glyph } from '@/ui/system'
import type { TimelapseProps } from '@/ui/timelapse'
import type { ResultsModel } from './model'
import s from './TimelapseEntry.module.css'

let chunk: Promise<typeof import('@/ui/timelapse')> | undefined
/** The player's chunk (asked for once; a failed download is asked for again next time). */
export function loadTimelapse() {
  chunk ??= import('@/ui/timelapse')
  chunk.catch(() => (chunk = undefined))
  return chunk
}

/** Sentinel-2 has a photo of this place: the report holds one, or its last clear look is one. */
export function hasTimelapse(model: Pick<ResultsModel, 'report'>): boolean {
  const { captures, clearCover } = model.report
  return clearCover?.collection === 'sentinel-2-l2a' || captures.some((c) => c.collection === 'sentinel-2-l2a')
}

export function TimelapseRow({ model }: { model: ResultsModel }) {
  if (!hasTimelapse(model)) return null
  const warm = () => void loadTimelapse().catch(() => undefined)
  return (
    <button type="button" className={s.row} onClick={() => useTimelapseUi.getState().show('results')} onPointerEnter={warm} onPointerDown={warm} onFocus={warm}>
      <span className={s.mark} aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={s.text}>
        <span className={s.title}>Time-lapse</span>
        <span className={s.sub}>This place, year by year</span>
      </span>
      <Glyph name="arrow-right" size={12} className={s.arrow} />
    </button>
  )
}

/** Mounts the player while the time-lapse is open, and opens it for a `?tl=` link once its report is on screen. */
export function TimelapseLayer({ model, mobile }: { model: ResultsModel | undefined; mobile: boolean }) {
  const open = useTimelapseUi((t) => t.open)
  const pending = useTimelapseUi((t) => t.pending)
  const [Player, setPlayer] = useState<ComponentType<TimelapseProps> | null>(null)

  useEffect(() => {
    if (!pending || !model) return
    // The link's request belongs to the first report after it; a place with nothing to play just drops it.
    if (hasTimelapse(model)) useTimelapseUi.getState().show('link')
    else useTimelapseUi.getState().request(false)
  }, [pending, model])

  // A new place closes it: the frames on screen would be the last place's.
  const placeKey = model ? `${model.report.place.lat},${model.report.place.lon}` : ''
  useEffect(() => () => useTimelapseUi.getState().close(), [placeKey])

  useEffect(() => {
    if (!open || Player) return
    let alive = true
    loadTimelapse().then(
      (m) => alive && setPlayer(() => m.Timelapse),
      () => alive && useTimelapseUi.getState().close(),
    )
    return () => {
      alive = false
    }
  }, [open, Player])

  if (!open || !model || !Player) return null
  const { place } = model.report
  return <Player place={{ label: place.label, lat: place.lat, lon: place.lon }} from={open.from} mobile={mobile} onClose={useTimelapseUi.getState().close} />
}
