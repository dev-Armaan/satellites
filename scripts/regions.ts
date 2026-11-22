/**
 * The name the offline list gives a Ukrainian oblast that GeoNames names after its capital (Kharkiv, Odesa, Kherson),
 * where that alone would leave it out.
 *
 * The list leaves out a region named like a city at its spot, as that city's own state (scripts/build-places.ts:
 * Tokyo, Kyiv City), and thirteen oblasts are named so in GeoNames: Kharkiv Oblast had no row, and a search for
 * Харківська область or Одесская область found streets in Russia or waited for the network. Those are kept as
 * "<name> Oblast", as GeoNames itself writes five oblasts (Kyiv Oblast, Rivne Oblast) and the geocoders all of them;
 * the place-name tables already name each under that name. Nothing else changes: the oblasts the list already had keep
 * their rows as they were (Mykolaiv, Zaporizhzhia: what an English search for those cities finds, GeoNames spelling
 * the cities Mykolayiv and Zaporizhzhya), and every town's where line keeps GeoNames' name. Crimea, Kyiv City and
 * Sevastopol City are not oblasts. Undefined for any other region.
 */
export function oblastName(code: string, geonames: string): string | undefined {
  if (!code.startsWith('UA.') || /\b(Oblast|City)$/.test(geonames) || geonames === 'Crimea') return undefined
  return `${geonames} Oblast`
}
