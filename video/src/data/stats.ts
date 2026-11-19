/**
 * The numbers the video states. Every one is read from production, none is rounded up, and each says where it came
 * from so it can be refreshed before a re-render (the site's rule: every number is real).
 *
 * Visits and searches are the admin page's all-time totals (`overflight_private.admin_stats_cache`, range 'all',
 * `totals.session` and `totals.search`), read 2026-11-19 15:00 UTC. A visit is a browser tab (docs/PRIVACY.md), so
 * the word on screen is "visits", never "users": the site cannot count people.
 */
export const STATS = {
  visits: 1_124_019,
  searches: 1_114_587,
  /** Launch (the Show HN post) was 9 November; the totals above are from the 19th. */
  days: 10,
  since: '9 Nov 2026',
  asOf: '19 Nov 2026',
} as const

/**
 * Every country and territory a visit came from, most visits first (`public.event_alltime`, type 'session', dim
 * 'country', read the same hour; the one empty code is dropped). All 227 are codes ICU knows as regions.
 */
export const COUNTRIES =
  'US IN GB JP CA FR DE NG HK TR ES AU BR SG NL SA ID PL ZA KE PH IT TW CN IE KR MY AR SE MX PT CH UA CZ AE PK BE VN NZ FI GH TH IL NO AT CO RS RO CL EG NP DK GR MA BD UG HU HR RU SK BG SI DZ LT EE LV QA KW PE AZ ZW ET UY IQ LK KZ OM EC JO GE DO VE AL BA BY PR MK CR CY MV PY UZ BH XK IS SN TZ ZM MW PA TN JM LU MT LB MO GT TT RW SV HN BW CI MU MD IR KH AM CM MN SO ME BO SY RE NA PS KG IM GG LY NI BN MZ CD JE BJ BB AO AF SD MR GY SZ AD BS ML MC SL GI HT LA MQ MM GP LS FJ TJ MG SR BT CU YE TG SS CW BZ KY BF GU GM LC PF GN AW SC PG GA CV BI BM VI LR AG GF NE FO DJ TD NC CG DM MF AX VG SX KN LI VU TL GL GD KI BQ WS IO VC TC SM AI KM PW YT CK CF SB PM AS MP TO MH GQ ST GW ER FK TV'.split(
    ' ',
  )

/** The most searched places, in order (the stored stats' `top['search.label']`), shortened to what fits a line. */
export const TOP_SEARCHES = ['Groom Lake, Nevada', 'Central Park', 'Pyramids of Giza', 'Palm Jumeirah', 'Uluru', 'Mount Everest']
