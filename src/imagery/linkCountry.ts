/**
 * The country of a place opened from a link, for its name only. A link is data (src/app/links.ts): `n=Munich` and a
 * point, no country, written the same in every language. Without a country, a name could only be looked up among the
 * table's countryless names (./exonyms.ts), so a German reader who searched München and reloaded, or opened a link a
 * friend sent, read Munich. A name alone cannot pick the country (London is Londra in Italian; London, Ontario is not):
 * the point can. The offline list's place of that name nearest the point (./localPlaces.ts localNamed: the tiles
 * around it and the landmarks first, else the name's own search file, which alone holds the regions, countries and
 * features) gives its country and what it is (a town, a region, a feature): a German reader who searched Palästina
 * and reloaded reads Palästinensische Autonomiegebiete again, not Palestinian Territory.
 *
 * Display only: the Place keeps no country (the usage stats and the address bar see the link as it came), and a link
 * whose name the list does not know near its point (a street, a typed label) stays countryless. Resolved before the
 * report shows the name (src/app/controller.ts runReport), once per link, and never in a language without a table
 * (English fetches nothing for it), so a name is never shown first one way and then another; and before a switch to a
 * language with a table shows the link's place on screen in it (the page's language until then may never have looked
 * it up: English, or Korean, whose four names are countryless too). A report or a switch waits for it EXONYM_WAIT_MS
 * at most (waitForLinkCountry), as for the table, and once only: a tile that stalls must not hold the report, and the
 * boot curtain over it, for ever, nor every switch after it. A language that showed the name before the answer (past
 * that wait) keeps it countryless for the rest of the page: an answer that comes later is not applied there. Per
 * language, as a late table is kept out of its own language only (./exonyms.ts): a language that has not shown the
 * name yet takes the answer, so a switch names the place as opening the link there would.
 */
import { currentLocale } from '@/i18n/runtime'
import type { Place } from '@/types'
import type { Locale } from '../../api/_lib/i18n/locales'
import { EXONYM_WAIT_MS, exonymsActive } from './exonyms'
import { localNamed } from './localPlaces'

type Linked = Pick<Place, 'countryCode' | 'kind'>

/** What the lookups answered, whenever they did. */
const resolved = new Map<string, Linked>()
const pending = new Map<string, Promise<void>>()
/** `<locale>|<key>`: links a language showed by name before their lookup answered; they stay countryless in it. */
const shownWithout = new Set<string>()
/**
 * Links whose lookup a wait has run out on (a report's, a switch's): nothing waits for it again, as for a stalled
 * table (./exonyms.ts overdue), or a switch after a stalled report would hold the page 3 s more for the same tile;
 * its answer, if it comes, still names the place in a language that has not shown it yet.
 */
const overdue = new Set<string>()
const keyOf = (p: Pick<Place, 'label' | 'lat' | 'lon'>) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}|${p.label}`

/**
 * Does `place` need resolving before its name is shown: a link's, with no country, in a language with names (or in
 * `locale`, the language a switch is going to: src/i18n/runtime.ts waitBeforeSwitch), not looked up yet, not given up
 * on by an earlier wait, and not shown in that language without it already? A link to a curated place is named from
 * the 'places' namespace instead (src/app/links.ts linkPlaceIn).
 */
export function needsLinkCountry(place: Place, locale?: Locale): boolean {
  if (place.source !== 'url' || place.countryCode || place.canonicalLabel !== undefined) return false
  if (locale === undefined && !exonymsActive()) return false
  const key = keyOf(place)
  return !resolved.has(key) && !overdue.has(key) && !shownWithout.has(`${locale ?? currentLocale()}|${key}`)
}

/**
 * Find the country the offline list gives a linked place's name at its point: start the lookup, or join the one under
 * way, and resolve when it answers, however long that takes (the boot starts it beside the engine). Never rejects: a
 * tile that cannot be read leaves the name countryless (and remembered so, so it never changes later in the page).
 */
export function resolveLinkCountry(place: Pick<Place, 'label' | 'lat' | 'lon'>): Promise<void> {
  const key = keyOf(place)
  if (resolved.has(key)) return Promise.resolve()
  let p = pending.get(key)
  if (!p) {
    const kindOf = (k: string) => (k === 'r' ? 'region' : k === 'f' || k === 'l' ? 'feature' : undefined)
    p = localNamed(place.label, place.lat, place.lon).then(
      (r) => void resolved.set(key, r ? { countryCode: r.cc.toLowerCase() || undefined, kind: kindOf(r.kind) } : {}),
      () => void resolved.set(key, {}),
    )
    pending.set(key, p)
  }
  return p
}

/**
 * resolveLinkCountry, waited for EXONYM_WAIT_MS at most: what anything about to show a link's name waits for (a
 * report, a switch). Past the wait, the name is shown without its country, and the language it is shown in keeps it so
 * (linkedForName), whatever the lookup answers later; and nothing waits for that lookup again (`overdue`). Never
 * rejects.
 */
export async function waitForLinkCountry(place: Pick<Place, 'label' | 'lat' | 'lon'>): Promise<void> {
  const key = keyOf(place)
  if (resolved.has(key) || overdue.has(key)) return
  let timer: ReturnType<typeof setTimeout> | undefined
  const limit = new Promise<void>((done) => (timer = setTimeout(done, EXONYM_WAIT_MS)))
  await Promise.race([resolveLinkCountry(place), limit])
  clearTimeout(timer)
  if (!resolved.has(key)) overdue.add(key)
}

/**
 * A linked place as its name is looked up: with the country (and kind) resolveLinkCountry found, if any. Asked in a
 * language with names before the lookup has answered (a wait that gave up), the name is shown without a country now,
 * and so it stays countryless in that language for the rest of the page: an answer that comes later would rename the
 * place on screen. On an English page nothing is kept: English names no place by its country, and a switch from it
 * still looks the country up.
 */
export function linkedForName<P extends Pick<Place, 'label' | 'lat' | 'lon' | 'countryCode' | 'kind'>>(place: P): P {
  if (place.countryCode) return place
  const key = keyOf(place)
  const here = `${currentLocale()}|${key}`
  const found = resolved.get(key)
  if (!found && exonymsActive()) shownWithout.add(here)
  return found?.countryCode && !shownWithout.has(here) ? { ...place, ...found } : place
}
