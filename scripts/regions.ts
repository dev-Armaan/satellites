/**
 * The English name the offline list and the place-name tables give a first-level region (GeoNames admin1CodesASCII),
 * where it is not GeoNames' own.
 *
 * Ukraine's oblasts are each "<name> Oblast", as GeoNames itself writes five of them (Kyiv Oblast, Rivne Oblast) and
 * the geocoders write all of them. GeoNames names the other twenty after their capitals (Kharkiv, Odesa, Kherson), and the
 * list leaves out a region named like a city at its spot, as that city's own state (scripts/build-places.ts: Tokyo,
 * Kyiv City): so Kharkiv Oblast had no row, and a search for Харківська область or Одесская область found streets in
 * Russia or waited for the network. Crimea, Kyiv City and Sevastopol City are not oblasts and keep their names.
 *
 * The tables also keep GeoNames' own name (scripts/build-exonyms.ts), which Open-Meteo, built on GeoNames, writes in a
 * where line.
 */
export function listRegionName(code: string, geonames: string): string {
  if (!code.startsWith('UA.') || /\b(Oblast|City)$/.test(geonames) || geonames === 'Crimea') return geonames
  return `${geonames} Oblast`
}
