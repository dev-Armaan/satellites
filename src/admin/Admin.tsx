/**
 * /admin: what people do in Watched, at a glance. Sign-in is a Supabase email magic link; the stats come from
 * the admin_stats RPC, which only answers for the admin's email (checked in the database).
 * The stats are computed hourly. Sessions, searches and shares, and the activity chart's bars, also add what was
 * counted since (admin_live), read with every load and Refresh and every 30 s while the page is in view; the rest of
 * the page waits for the hour, and the note under the totals says so.
 * DEV only: /admin?mock=1 renders a fixture without signing in (src/admin/fixture.ts).
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Wordmark } from '@/ui/system/Wordmark'
import { RANGES, currentSession, fetchLive, fetchStats, liveFor, sendMagicLink, signOut, supabase, takeAuthError, verifyCode, type AdminStats, type LiveCounts, type Range } from './api'
import { ActivityChart, Funnel, RankList, Split, WorldMap } from './charts'
import { liveSeries } from './live'
import { ACTION_NAMES, DEVICE_NAMES, SOURCE_NAMES, VERDICT_NAMES, countryName, fmtAgo, fmtClock, fmtInt, fmtUpdated, fmtPct, fmtSec, fmtStamp, maintBehind } from './format'

type View =
  | { kind: 'loading' }
  | { kind: 'signed-out'; sent?: string; error?: string; email?: string }
  | { kind: 'denied'; email?: string; message: string }
  | { kind: 'ready'; email?: string; mock?: boolean }

const MOCK = import.meta.env.DEV ? new URLSearchParams(location.search).has('mock') : false
const RANGE_KEY = 'watched-admin.range'
/** How often the live counts are read while the page is in view. One small indexed read each. */
const LIVE_EVERY_MS = 30e3
/** A used or expired link comes back with an error in the URL: read once, before the auth client starts, and shown
 *  instead of a blank form. */
const LINK_ERROR = takeAuthError() ?? undefined

function initialRange(): Range {
  try {
    const r = localStorage.getItem(RANGE_KEY) as Range | null
    if (r && RANGES.includes(r)) return r
  } catch {
    /* default */
  }
  return '7d'
}

export function Admin() {
  const [view, setView] = useState<View>({ kind: 'loading' })
  const [range, setRange] = useState<Range>(initialRange)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [live, setLive] = useState<LiveCounts | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Session (or the fixture)
  useEffect(() => {
    if (import.meta.env.DEV && MOCK) {
      setView({ kind: 'ready', email: 'owner@example.com', mock: true })
      return
    }
    const sb = supabase()
    if (!sb) {
      setView({ kind: 'signed-out', error: 'Supabase is not configured for this build.' })
      return
    }
    void currentSession().then((s) => setView(s ? { kind: 'ready', email: s.user.email } : { kind: 'signed-out', error: LINK_ERROR }))
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      setView((v) => (s ? (v.kind === 'ready' || v.kind === 'denied' ? v : { kind: 'ready', email: s.user.email }) : { kind: 'signed-out' }))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Only the latest request may land: a slow answer for an earlier range must not overwrite a newer one.
  const latest = useRef(0)
  const load = useCallback(
    async (r: Range) => {
      const id = ++latest.current
      setBusy(true)
      setErr(null)
      if (import.meta.env.DEV && MOCK) {
        const { mockLive, mockStats } = await import('./fixture')
        if (id !== latest.current) return
        const s = mockStats(r)
        setStats(s)
        setLive(mockLive(s))
        setBusy(false)
        return
      }
      const [res, lv] = await Promise.all([fetchStats(r), fetchLive(r)])
      if (id !== latest.current) return
      setBusy(false)
      if (lv !== undefined) setLive(lv)
      if (res.ok) setStats(res.stats)
      else if (res.denied) setView((v) => ({ kind: 'denied', email: v.kind === 'ready' ? v.email : undefined, message: res.message }))
      else setErr(res.message)
    },
    [],
  )

  useEffect(() => {
    if (view.kind !== 'ready') return
    void load(range)
    try {
      localStorage.setItem(RANGE_KEY, range)
    } catch {
      /* per-viewer convenience only */
    }
  }, [view.kind, range, load])

  // The live counts alone, every 30 s while the page is in view and when it comes back into view.
  useEffect(() => {
    if (view.kind !== 'ready' || (import.meta.env.DEV && MOCK)) return
    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      const id = latest.current
      const lv = await fetchLive(range)
      if (id === latest.current && lv !== undefined) setLive(lv) // a load that started meanwhile brings newer counts
    }
    const timer = setInterval(() => void poll(), LIVE_EVERY_MS)
    document.addEventListener('visibilitychange', poll)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [view.kind, range])

  // Counts that continue newer stats than the page has: the hourly refresh has run. Load them, once for each.
  const reloadedFor = useRef(0)
  useEffect(() => {
    if (!live || !stats || stats.cachedAt == null || live.range !== stats.range || live.since <= stats.cachedAt) return
    if (reloadedFor.current === live.since) return
    reloadedFor.current = live.since
    void load(stats.range)
  }, [live, stats, load])

  if (view.kind === 'loading') return <Shell />
  if (view.kind === 'signed-out')
    return (
      <SignIn
        key={view.sent ?? 'form'}
        sent={view.sent}
        error={view.error}
        initialEmail={view.email}
        onSent={(email) => setView({ kind: 'signed-out', sent: email })}
        onReset={() => setView({ kind: 'signed-out', email: view.sent })}
      />
    )
  if (view.kind === 'denied')
    return (
      <Shell>
        <section className="a-gate">
          <p className="a-label">ACCESS</p>
          <h1 className="a-gate-h">This account can’t see the stats.</h1>
          <p className="a-gate-p">
            Signed in as <span className="a-mono">{view.email ?? 'unknown'}</span>. Only the owner’s address is on the admin list.
          </p>
          <button type="button" className="a-btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </section>
      </Shell>
    )

  return (
    <Shell
      right={
        <>
          <RangePicker value={range} onChange={setRange} />
          <span className="a-who">
            {view.mock ? 'MOCK DATA' : view.email}
            {!view.mock && (
              <button type="button" className="a-link" onClick={() => void signOut()}>
                Sign out
              </button>
            )}
          </span>
        </>
      }
    >
      {err && (
        <p className="a-error">
          Couldn’t load the stats: {err}{' '}
          <button type="button" className="a-link" onClick={() => void load(range)} disabled={busy}>
            Retry
          </button>
        </p>
      )}
      {stats ? (
        <Dashboard s={stats} live={liveFor(stats, live)} busy={busy} onRefresh={() => void load(range)} />
      ) : (
        !err && <p className="a-empty a-pad">Loading…</p>
      )}
    </Shell>
  )
}

// ── Chrome ──────────────────────────────────────────────────────────────────────────────────

function Shell({ children, right }: { children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="a-page">
      <header className="a-head">
        <a href="/" className="a-brand" aria-label="Watched">
          <Wordmark height={22} />
          <span className="a-label">ADMIN</span>
        </a>
        <div className="a-head-right">{right}</div>
      </header>
      <main className="a-main">{children}</main>
    </div>
  )
}

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="a-range" role="radiogroup" aria-label="Range">
      {RANGES.map((r) => (
        <button key={r} type="button" role="radio" aria-checked={r === value} className={r === value ? 'on' : undefined} onClick={() => onChange(r)}>
          {r === 'all' ? 'ALL' : r.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/**
 * Off: the project sends mail with Supabase's default provider, whose templates can't carry a {{ .Token }} code.
 * Turn on (and add the code to the Magic Link + Confirm signup templates) once a custom SMTP sender is set up.
 */
const CODE_SIGN_IN = false

function SignIn({ sent, error, initialEmail, onSent, onReset }: { sent?: string; error?: string; initialEmail?: string; onSent: (email: string) => void; onReset: () => void }) {
  const [email, setEmail] = useState(initialEmail ?? '')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<string | null>(error ?? null)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return setMsg('Enter an email address.')
    setPending(true)
    const problem = await sendMagicLink(v)
    setPending(false)
    setMsg(problem)
    if (!problem) onSent(v)
  }
  const submitCode = async (e: FormEvent) => {
    e.preventDefault()
    const c = code.replace(/\s+/g, '')
    if (!sent || !/^\d{6,10}$/.test(c)) return setMsg('Enter the code from the email.')
    setPending(true)
    const problem = await verifyCode(sent, c)
    setPending(false)
    setMsg(problem) // success: the auth listener switches to the stats
  }
  return (
    <Shell>
      <section className="a-gate">
        <p className="a-label">SIGN IN</p>
        {sent ? (
          <div className="a-form">
            <h1 className="a-gate-h">Check your inbox.</h1>
            <p className="a-gate-p">
              A sign-in link is on its way to <span className="a-mono">{sent}</span>. Tap it on this device and it brings you back here, signed in.
            </p>
            {CODE_SIGN_IN && (
              <form onSubmit={submitCode} className="a-form">
                <label className="a-label" htmlFor="a-code">
                  CODE
                </label>
                <input id="a-code" className="a-input a-input-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
                  {pending ? 'Checking…' : 'Sign in'}
                </button>
              </form>
            )}
            {msg && <p className="a-error">{msg}</p>}
            <button type="button" className="a-btn" onClick={onReset}>
              Send a new link
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="a-form">
            <h1 className="a-gate-h">Stats are for the owner.</h1>
            {msg && <p className="a-error">{msg}</p>}
            <label className="a-label" htmlFor="a-email">
              EMAIL
            </label>
            <input id="a-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className="a-input" placeholder="you@example.com" required />
            <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
              {pending ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </section>
    </Shell>
  )
}

function Section({ n, title, children, className }: { n: number; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`a-sec ${className ?? ''}`}>
      <h2 className="a-rule">
        <span>
          {String(n).padStart(2, '0')} / {title}
        </span>
      </h2>
      {children}
    </section>
  )
}

function Panel({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <div className="a-panel">
      <h3 className="a-label">{title}</h3>
      {children}
      {note && <p className="a-note">{note}</p>}
    </div>
  )
}

function Kpi({ label, value, sub, signal }: { label: string; value: string; sub?: string; signal?: boolean }) {
  return (
    <div className="a-kpi">
      <span className="a-label">{label}</span>
      <span className={signal ? 'a-kpi-v a-signal-text' : 'a-kpi-v'}>{value}</span>
      <span className="a-kpi-sub">{sub ?? ' '}</span>
    </div>
  )
}

/** '1 share', '2,345 searches' */
const count = (n: number, one: string, many: string): string => `${fmtInt(n)} ${n === 1 ? one : many}`

/** The clock, re-read every `ms` so relative times ('updated 3 min ago') keep up while the page stays open. */
function useNow(ms: number): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

// ── Dashboard ───────────────────────────────────────────────────────────────────────────────

const RANGE_WORDS: Record<Range, string> = { '24h': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days', all: 'all time' }

/** `live`: what was counted since `s` was computed (already matched to it, liveFor), added to the three totals. */
function Dashboard({ s, live, busy, onRefresh }: { s: AdminStats; live: LiveCounts | null; busy: boolean; onRefresh: () => void }) {
  const t = s.totals
  const f = s.funnel
  const sessions = (t.session ?? 0) + (live?.session ?? 0)
  const searches = (t.search ?? 0) + (live?.search ?? 0)
  // Ratios and shares divide by what was recorded: an outage's rebuilt hours (0015) have counts but no breakdowns.
  const rec = s.recorded
  const shares = (t.share_action ?? 0) + (live?.share_action ?? 0)
  const conv = f.search ? (f.share_action ?? 0) / f.search : null
  const stages = [
    { key: 'search', label: 'Searched', n: f.search ?? 0 },
    { key: 'results', label: 'Saw results', n: f.results ?? 0 },
    { key: 'pass_open', label: 'Opened a pass', n: f.pass_open ?? 0 },
    { key: 'lightbox_open', label: 'Expanded a photo', n: f.lightbox_open ?? 0 },
    { key: 'share_open', label: 'Opened share', n: f.share_open ?? 0 },
    { key: 'share_action', label: 'Shared', n: f.share_action ?? 0 },
  ]
  const r = s.results
  const v = s.vitals
  const now = useNow(30e3)
  // A database from 0016 on says where the range starts, and its days are US Eastern; before, they were UTC.
  const etDays = s.from != null

  return (
    <div className={busy ? 'a-dash a-busy' : 'a-dash'}>
      {maintBehind(s) && (
        <p className="a-warn">
          STATS MAINTENANCE IS BEHIND · LAST RUN {s.maintLastAt ? fmtAgo(s.maintLastAt, s.generatedAt) : 'NEVER'}
          {s.rolledThrough ? ` · DAILY TOTALS THROUGH ${s.rolledThrough}` : ''}. Recent days are counted from raw events meanwhile; check the
          watched-events-maintain cron job.
        </p>
      )}
      <p className="a-status">
        <span>{RANGE_WORDS[s.range].toUpperCase()}</span>
        {s.from != null && <span className="a-dim">FROM {fmtStamp(s.from)}</span>}
        <span className="a-dim">GENERATED {fmtStamp(s.generatedAt)}</span>
        {s.cachedAt != null && <span className="a-dim">{fmtUpdated(s.cachedAt, now)}</span>}
        <button type="button" className="a-link" onClick={onRefresh} disabled={busy}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </p>

      <Section n={1} title="OVERVIEW">
        <div className="a-kpis">
          <Kpi label="SESSIONS" value={fmtInt(sessions)} sub={t.view ? `${fmtInt(t.view)} page loads` : undefined} />
          <Kpi label="SEARCHES" value={fmtInt(searches)} sub={rec.session ? `${(rec.search / rec.session).toFixed(2)} per session` : undefined} />
          <Kpi label="RESULTS" value={fmtInt(t.results)} sub={rec.search ? `${fmtPct((t.results ?? 0) / rec.search)} of searches` : undefined} />
          <Kpi label="PASS OPENS" value={fmtInt(t.pass_open)} sub={t.lightbox_open ? `${fmtInt(t.lightbox_open)} photo expands` : undefined} />
          <Kpi label="SHARES" value={fmtInt(shares)} sub={t.share_open ? `${fmtInt(t.share_open)} sheet opens` : undefined} signal />
          <Kpi label="SEARCH → SHARE" value={fmtPct(conv)} sub="of searching sessions" signal />
        </div>
        {live && (
          <p className="a-note">
            Sessions, searches and shares{live.hours ? ', and the activity chart,' : ''} are counted to {fmtClock(live.at)}: they include {count(live.session, 'session', 'sessions')},{' '}
            {count(live.search, 'search', 'searches')} and {count(live.share_action, 'share', 'shares')} since the hourly update. Everything
            else on this page, the lines under these three too, is as of that update.
          </p>
        )}
      </Section>

      <Section n={2} title={s.bucket === 'hour' ? 'ACTIVITY · HOURLY ET' : etDays ? 'ACTIVITY · DAILY ET' : 'ACTIVITY · DAILY (UTC DAYS)'}>
        <ActivityChart series={liveSeries(s.series, s.bucket, live?.hours ?? null)} bucket={s.bucket} />
      </Section>

      <div className="a-cols">
        <Section n={3} title="FUNNEL · SESSIONS">
          <Funnel stages={stages} />
          <p className="a-note">Sessions that reached each step. The last column is the share of the step before.</p>
        </Section>
        <Section n={4} title="HOW PEOPLE SEARCH">
          <RankList rows={s.top['search.source']} total={rec.search} label={(x) => SOURCE_NAMES[x] ?? x} />
        </Section>
      </div>

      <Section n={5} title="PLACES">
        <div className="a-places">
          <WorldMap cells={s.top['search.cell']} />
          <div className="a-places-lists">
            <Panel title="TOP PLACES">
              <RankList rows={s.top['search.label']} total={rec.search} max={10} accent />
            </Panel>
            <Panel title="TOP COUNTRIES SEARCHED">
              <RankList rows={s.top['search.country']} total={rec.search} max={8} label={countryName} />
            </Panel>
          </div>
        </div>
      </Section>

      <Section n={6} title="SATELLITES">
        <div className="a-grid3">
          <Panel title="MOST OPENED">
            <RankList rows={s.top['pass_open.sat']} total={t.pass_open} />
          </Panel>
          <Panel title="MOST SHARED">
            <RankList rows={s.top['share_action.sat']} total={t.share_action} accent />
          </Panel>
          <Panel title="PASS OPENS BY VERDICT">
            <Split rows={s.top['pass_open.verdict']} total={t.pass_open} names={VERDICT_NAMES} />
          </Panel>
        </div>
      </Section>

      <Section n={7} title="SHARING & AUDIENCE">
        <div className="a-grid3">
          <Panel title="SHARE ACTIONS">
            <Split rows={s.top['share_action.action']} total={t.share_action} names={ACTION_NAMES} />
          </Panel>
          <Panel title="DEVICES">
            <Split rows={s.top['session.device']} total={rec.session} names={DEVICE_NAMES} />
          </Panel>
          <Panel title="VISITOR COUNTRIES" note="From the host's edge; the IP itself is never stored.">
            <RankList rows={s.top['session.country']} total={rec.session} max={6} label={countryName} />
          </Panel>
          <Panel title="REFERRERS">
            <RankList rows={s.top['session.ref']} total={rec.session} max={6} empty="No referrers yet" />
          </Panel>
          <Panel title="UTM · SOURCE / MEDIUM / CAMPAIGN">
            <RankList rows={s.top['session.utm']} total={rec.session} max={6} empty="No tagged links yet" />
          </Panel>
          <Panel title="SPEED">
            <dl className="a-facts">
              <dt>FIRST RESULTS P50</dt>
              <dd>
                {fmtSec(r.p50Ms)} <small>S</small>
              </dd>
              <dt>FIRST RESULTS P90</dt>
              <dd>
                {fmtSec(r.p90Ms)} <small>S</small>
              </dd>
              <dt>PARTIAL AT FIRST PAINT</dt>
              <dd>{r.n ? fmtPct(r.partial / r.n) : '—'}</dd>
              <dt>ARCHIVES DOWN</dt>
              <dd>{r.n ? fmtPct(r.archiveFailed / r.n) : '—'}</dd>
              <dt>LCP · INP · CLS (P75)</dt>
              <dd>
                {fmtSec(v.lcp)} <small>S</small> · {fmtInt(v.inp)} <small>MS</small> · {v.cls == null ? '—' : v.cls.toFixed(3)}
              </dd>
            </dl>
          </Panel>
        </div>
      </Section>

      <div className="a-cols">
        <Section n={8} title="RECENT SEARCHES">
          {s.recentSearches.length ? (
            <ul className="a-feed">
              {s.recentSearches.map((x, i) => (
                <li key={`${x.t}-${i}`}>
                  <span className="a-feed-t">{fmtAgo(x.t, s.generatedAt)}</span>
                  <span className="a-feed-main">{x.label ?? (x.cell ? `Cell ${x.cell}` : '—')}</span>
                  <span className="a-feed-meta">
                    {[x.country?.toUpperCase(), SOURCE_NAMES[x.source ?? ''] ?? x.source, x.device].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-empty">No searches in this range.</p>
          )}
        </Section>
        <Section n={9} title="RECENT ERRORS">
          {s.recentErrors.length ? (
            <ul className="a-feed">
              {s.recentErrors.map((x, i) => (
                <li key={`${x.t}-${i}`}>
                  <span className="a-feed-t">{fmtAgo(x.t, s.generatedAt)}</span>
                  <span className="a-feed-main a-mono-s">{x.msg}</span>
                  <span className="a-feed-meta">{x.where?.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-empty">No errors in this range.</p>
          )}
        </Section>
      </div>

      <p className="a-foot">
        Counted per browser tab: no cookies, no IPs, places at city level and 0.1° cells.{' '}
        {etDays
          ? 'Raw events are kept 48 hours, then hourly and daily totals. Each hour and day keeps its top 3,000 map cells and top 200 of every other list, so the tail of a long list (and the map’s smallest dots) can come up a little short; totals and percentages count everything. A tab counts once a day. Times and days are US Eastern; 24H starts on the hour, 7D and 30D at midnight.'
          : 'Raw events are kept 90 days; daily totals after that. Times are US Eastern; daily totals are UTC days.'}
      </p>
    </div>
  )
}
