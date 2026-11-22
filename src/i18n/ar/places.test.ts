/**
 * The Arabic catalog sets a place without Arabic letters as its own left-to-right island in DOM sentences: a place
 * searched by coordinates otherwise read «12.500 ,23.500.» in the headline. A Latin name's own final dot («D.C.») must
 * stay outside the island, where it ends the sentence, and an Arabic name is never isolated.
 */
import { describe, expect, it } from 'vitest'
import pass from './pass'
import results from './results'

const flat = (x: unknown): string =>
  typeof x === 'string' ? x : Array.isArray(x) ? x.map(flat).join('') : x && typeof x === 'object' ? Object.values(x).map(flat).join('') : ''

const sentences = (place: string): Record<string, string> => ({
  watched: flat(results.headline.watched(5, place, { lastDays: 7 })),
  none: flat(results.headline.none(place, false)),
  passTimes: results.notes.passTimes(place, undefined, 'UTC'),
  shared: results.head.shared('NOAA 20', place),
  caption: flat(results.computing.sharedCaption('NOAA 20', place)),
  captionNoSat: flat(results.computing.sharedCaption(undefined, place)),
  reached: flat(pass.geo.reached({ place, time: '10:00', zone: 'UTC', heading: 'n' })),
  mosaic: flat(pass.mosaic({ sensor: 'VIIRS', place, gsdM: 375 })),
  radarImaged: flat(pass.radarImaged({ deg: 30, place, gsdM: 10, dark: false })),
  insideSwath: flat(pass.could.insideSwath({ place, swathKm: 290 })),
  radar: flat(pass.could.radar({ place, openArchive: true })),
  radarAngled: flat(pass.could.radar({ place, deg: 20, openArchive: false })),
  camera: flat(pass.could.camera({ place })),
  cameraAngled: flat(pass.could.camera({ place, deg: 20 })),
})

describe('Arabic: a Latin place in DOM sentences', () => {
  it('isolates a coordinates place everywhere', () => {
    for (const [k, v] of Object.entries(sentences('23.500, 12.500'))) expect(v, k).toContain('⁦23.500, 12.500⁩')
  })
  it('keeps a Latin name’s own final dot outside its island, and adds no second one', () => {
    const s = sentences('Washington, D.C.')
    for (const k of ['watched', 'none', 'insideSwath', 'radar', 'radarAngled', 'cameraAngled']) {
      expect(s[k], k).toContain('⁦Washington, D.C⁩.')
      expect(s[k], k).not.toContain('..')
    }
  })
  it('leaves an Arabic name as it is', () => {
    for (const [k, v] of Object.entries(sentences('القاهرة'))) expect(v, k).not.toContain('⁦القاهرة')
  })
})
