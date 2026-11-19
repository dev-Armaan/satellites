/**
 * The numbers the video states, and what is behind each.
 *
 * On screen (owner, 2026-11-19): "1,000,000+ users in under 7 days", "1,000,000+ searches", and no exact figures.
 * Behind them, from production (`overflight_private.admin_stats_cache`, range 'all', read 2026-11-19 15:00 UTC):
 * 1,124,019 visits and 1,114,587 searches since launch on 9 November. Through 15 November, the seventh day, the daily
 * series sums to 1,082,310 visits and 1,064,326 searches, so both passed a million inside the first seven days.
 * A visit is a browser tab (docs/PRIVACY.md); the site cannot count people, and "users" is the owner's word for them.
 */
export const STATS = {
  million: 1_000_000,
  days: 7,
  since: '9 Nov 2026',
} as const

/**
 * Every country and territory a visit came from, most visits first (`public.event_alltime`, type 'session', dim
 * 'country', read the same hour; the one empty code is dropped). All 227 are codes ICU knows as regions.
 */
export const COUNTRIES =
  'US IN GB JP CA FR DE NG HK TR ES AU BR SG NL SA ID PL ZA KE PH IT TW CN IE KR MY AR SE MX PT CH UA CZ AE PK BE VN NZ FI GH TH IL NO AT CO RS RO CL EG NP DK GR MA BD UG HU HR RU SK BG SI DZ LT EE LV QA KW PE AZ ZW ET UY IQ LK KZ OM EC JO GE DO VE AL BA BY PR MK CR CY MV PY UZ BH XK IS SN TZ ZM MW PA TN JM LU MT LB MO GT TT RW SV HN BW CI MU MD IR KH AM CM MN SO ME BO SY RE NA PS KG IM GG LY NI BN MZ CD JE BJ BB AO AF SD MR GY SZ AD BS ML MC SL GI HT LA MQ MM GP LS FJ TJ MG SR BT CU YE TG SS CW BZ KY BF GU GM LC PF GN AW SC PG GA CV BI BM VI LR AG GF NE FO DJ TD NC CG DM MF AX VG SX KN LI VU TL GL GD KI BQ WS IO VC TC SM AI KM PW YT CK CF SB PM AS MP TO MH GQ ST GW ER FK TV'.split(
    ' ',
  )
