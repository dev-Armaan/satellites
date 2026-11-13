/**
 * The admin page's data: Supabase Auth (email magic link) and the `admin_stats` RPC.
 * supabase-js lives only in this chunk (the app talks to PostgREST with fetch, src/lib/backend.ts).
 *
 * The page is not the security boundary: admin_stats checks the signed-in email against a private
 * admins table inside the database and refuses everyone else (anon has no grant at all).
 */
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

export type Range = '24h' | '7d' | '30d' | 'all'
export const RANGES: Range[] = ['24h', '7d', '30d', 'all']

export type Ranked = [string, number][]

export interface AdminStats {
  range: Range
  generatedAt: number
  /** Where the range starts, ms: the hour 24 hours before this one for 24h (0019; now - 24 h before); Eastern midnight
   *  6 or 29 days before today for 7d and 30d; the first day for all. Null from a database before 0016, whose 7d and 30d
   *  ran back from now and whose days were UTC. */
  from: number | null
  bucket: 'hour' | 'day'
  /** Event counts by type, plus `session` (tabs). `search` and `session` include hours rebuilt after an outage (0015) */
  totals: Record<string, number>
  /** `search` and `session` as the database recorded them, without the rebuilt hours: the denominators for ratios and
   *  shares, whose numerators (results, devices, places…) only exist for recorded events. Equal to totals before 0015. */
  recorded: { search: number; session: number }
  /** Sum over every value of each top-list dimension ('search.label' → searches with a label), for percentages */
  dimTotals: Record<string, number>
  /** Distinct tabs (per day, summed) that reached each stage */
  funnel: Record<string, number>
  /** [bucket start ms, searches, shares, sessions, time-lapse opens (0 from a database before 0023)] */
  series: [number, number, number, number, number][]
  /** 'search.label', 'search.country', 'search.source', 'search.cell', 'session.device', 'session.country',
   *  'session.ref', 'session.utm', 'pass_open.sat', 'pass_open.verdict', 'share_action.sat', 'share_action.action',
   *  'timelapse_open.from', 'timelapse_share.action' (0023) */
  top: Record<string, Ranked>
  results: { n: number; p50Ms: number | null; p90Ms: number | null; partial: number; archiveFailed: number }
  vitals: { n: number; lcp: number | null; inp: number | null; cls: number | null }
  recentSearches: { t: number; label?: string; country?: string; source?: string; cell?: string; device?: string }[]
  recentErrors: { t: number; where?: string; msg?: string }[]
  /** When the hourly maintenance (rollup + prune, pg_cron) last ran, ms; null if it never has */
  maintLastAt: number | null
  /** The last day rolled into the daily totals, 'YYYY-MM-DD' (a US Eastern day from 0016, UTC before) */
  rolledThrough: string | null
  /** When these stats were computed (the cache, 0009; refreshed hourly at :00 since 0019), ms; null before 0009 */
  cachedAt: number | null
}

let client: SupabaseClient | null | undefined

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()
  client = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'watched-admin' } }) : null
  return client
}

export async function currentSession(): Promise<Session | null> {
  const sb = supabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function sendMagicLink(email: string): Promise<string | null> {
  const sb = supabase()
  if (!sb) return 'Supabase is not configured for this build.'
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/admin` } })
  return error ? error.message : null
}

/**
 * A one-time code from the sign-in email. Unused while the project sends with Supabase's default mailer, whose
 * templates can't be edited (no {{ .Token }} in the email): see CODE_SIGN_IN in Admin.tsx.
 */
export async function verifyCode(email: string, token: string): Promise<string | null> {
  const sb = supabase()
  if (!sb) return 'Supabase is not configured for this build.'
  const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' })
  return error ? error.message : null
}

/**
 * A failed sign-in link lands here as /admin#error=access_denied&error_code=otp_expired&error_description=…
 * (or ?error=… for the code flow). Returns the readable message and removes it from the address bar.
 */
export function takeAuthError(): string | null {
  const params = [new URLSearchParams(location.hash.replace(/^#/, '')), new URLSearchParams(location.search)]
  for (const p of params) {
    const desc = p.get('error_description') ?? p.get('error')
    if (!desc) continue
    history.replaceState(null, '', location.pathname)
    const code = p.get('error_code')
    if (code === 'otp_expired') return 'That sign-in link was already used or has expired. Send a new one. If links keep arriving already used (some mail scanners open them first), a second address can be added to the admin list.'
    return desc.replace(/\+/g, ' ')
  }
  return null
}

export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut()
}

export type StatsResult = { ok: true; stats: AdminStats } | { ok: false; denied: boolean; message: string }

export async function fetchStats(range: Range): Promise<StatsResult> {
  const sb = supabase()
  if (!sb) return { ok: false, denied: false, message: 'Supabase is not configured for this build.' }
  let { data, error } = await sb.rpc('admin_stats', { p_range: range })
  // A statement timeout (57014) on a cold cache usually succeeds straight after, once the pages are in memory:
  // retry once here so the page doesn't need a second manual Refresh.
  if (error && isTimeout(error)) ({ data, error } = await sb.rpc('admin_stats', { p_range: range }))
  if (error) return { ok: false, denied: error.code === '42501' || /not allowed|permission/i.test(error.message), message: error.message }
  const stats = parseStats(data)
  return stats ? { ok: true, stats } : { ok: false, denied: false, message: 'Unexpected response.' }
}

/** Postgres query_canceled: the authenticated role's statement_timeout (exported for tests). */
export const isTimeout = (e: { code?: string; message?: string }): boolean => e.code === '57014' || /statement timeout/i.test(e.message ?? '')

const isObj =(v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Defensive parse of the RPC's JSON (exported for tests). */
export function parseStats(v: unknown): AdminStats | null {
  if (!isObj(v) || !RANGES.includes(v.range as Range)) return null
  const rec = (o: unknown): Record<string, number> => (isObj(o) ? Object.fromEntries(Object.entries(o).map(([k, x]) => [k, num(x)])) : {})
  const top: Record<string, Ranked> = {}
  if (isObj(v.top))
    for (const [k, rows] of Object.entries(v.top))
      if (Array.isArray(rows)) top[k] = rows.filter((r): r is [string, number] => Array.isArray(r) && typeof r[0] === 'string').map((r) => [r[0], num(r[1])])
  const r = isObj(v.results) ? v.results : {}
  const vi = isObj(v.vitals) ? v.vitals : {}
  const totals = rec(v.totals)
  const rd = isObj(v.recorded) ? v.recorded : {}
  const recorded = (k: 'search' | 'session') => (typeof rd[k] === 'number' ? num(rd[k]) : (totals[k] ?? 0))
  return {
    range: v.range as Range,
    generatedAt: num(v.generatedAt),
    from: numOrNull(v.from),
    bucket: v.bucket === 'day' ? 'day' : 'hour',
    totals,
    recorded: { search: recorded('search'), session: recorded('session') },
    dimTotals: rec(v.dimTotals),
    funnel: rec(v.funnel),
    series: Array.isArray(v.series) ? v.series.filter(Array.isArray).map((s) => [num(s[0]), num(s[1]), num(s[2]), num(s[3]), num(s[4])] as [number, number, number, number, number]) : [],
    top,
    results: { n: num(r.n), p50Ms: numOrNull(r.p50Ms), p90Ms: numOrNull(r.p90Ms), partial: num(r.partial), archiveFailed: num(r.archiveFailed) },
    vitals: { n: num(vi.n), lcp: numOrNull(vi.lcp), inp: numOrNull(vi.inp), cls: numOrNull(vi.cls) },
    recentSearches: Array.isArray(v.recentSearches) ? (v.recentSearches.filter(isObj) as AdminStats['recentSearches']) : [],
    maintLastAt: numOrNull(v.maintLastAt),
    rolledThrough: typeof v.rolledThrough === 'string' ? v.rolledThrough : null,
    cachedAt: numOrNull(v.cachedAt),
    recentErrors: Array.isArray(v.recentErrors) ? (v.recentErrors.filter(isObj) as AdminStats['recentErrors']) : [],
  }
}
