/**
 * Small, dependency-free network helpers shared by every imagery client.
 *
 *  - `withRetry(fn)` runs an attempt with its own timeout, retries transient failures
 *    (network errors, timeouts, 408/425/429/5xx) and stays abortable throughout.
 *  - `fetchJson(url)` is the common case: GET/POST → parsed JSON, under the same rules.
 *
 * Every public archive we talk to is a free, best-effort service, so a slow or flaky
 * response is the normal case, not an exception: a single retry after a short jittered pause
 * recovers most of them without making a dead endpoint feel slower than it has to.
 */

export const DEFAULT_TIMEOUT_MS = 12_000

/** A non-2xx HTTP response. `retryable` is true for statuses worth one more try. */
export class HttpError extends Error {
  readonly status: number
  readonly url: string
  readonly body?: string
  constructor(status: number, url: string, body?: string) {
    super(`HTTP ${status} from ${hostOf(url)}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
    this.body = body
  }
  get retryable(): boolean {
    return this.status === 408 || this.status === 425 || this.status === 429 || this.status >= 500
  }
}

/** An attempt exceeded its time budget (distinct from a caller abort). */
export class TimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`${hostOf(url)} did not answer within ${Math.round(ms / 1000)} s`)
    this.name = 'TimeoutError'
  }
}

export interface RetryOptions {
  /** Per-attempt budget, including reading the body. Default 12 s. */
  timeoutMs?: number
  /** Extra attempts after the first. Default 1. */
  retries?: number
  /** Base pause before a retry; jittered ×[1, 1.6). Default 600 ms. */
  retryDelayMs?: number
  signal?: AbortSignal
  /** Used in error messages only. */
  label?: string
}

export interface FetchJsonOptions extends RetryOptions {
  method?: 'GET' | 'POST'
  /** JSON-serialisable body (sets content-type). */
  body?: unknown
  headers?: Record<string, string>
}

/** True for errors caused by the caller aborting (never retried, always rethrown). */
export function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    ((err as { name: string }).name === 'AbortError' || (err as { name: string }).name === 'CanceledError')
  )
}

/** The reason a signal was aborted, normalised to an AbortError-shaped Error. */
export function abortReason(signal: AbortSignal): Error {
  const r: unknown = signal.reason
  if (r instanceof Error) return r
  const e = new Error(typeof r === 'string' ? r : 'Aborted')
  e.name = 'AbortError'
  return e
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortReason(signal)
}

/** Resolves after `ms`, or rejects as soon as `signal` aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortReason(signal))
    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(id)
      reject(abortReason(signal!))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Lets a consumer stop waiting on a shared promise without cancelling it for everyone else
 * (used for cached image loads and cached lookups).
 */
export function raceAbort<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p
  if (signal.aborted) return Promise.reject(abortReason(signal))
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal))
    signal.addEventListener('abort', onAbort, { once: true })
    p.then(
      (v) => {
        signal.removeEventListener('abort', onAbort)
        resolve(v)
      },
      (e) => {
        signal.removeEventListener('abort', onAbort)
        reject(e)
      },
    )
  })
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.retryable
  if (err instanceof TimeoutError) return true
  // fetch() network failures surface as TypeError ("Failed to fetch", "fetch failed", "Load failed").
  return err instanceof TypeError
}

/**
 * Runs `attempt(signal)` with a per-attempt timeout, retrying transient failures.
 * The signal handed to `attempt` aborts on timeout OR when the caller's signal aborts.
 */
export async function withRetry<T>(attempt: (signal: AbortSignal) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, retryDelayMs = 600, signal, label = 'request' } = opts
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    throwIfAborted(signal)
    const ctrl = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      ctrl.abort()
    }, timeoutMs)
    const onAbort = () => ctrl.abort(signal?.reason)
    signal?.addEventListener('abort', onAbort, { once: true })
    try {
      return await attempt(ctrl.signal)
    } catch (err) {
      if (signal?.aborted) throw abortReason(signal)
      lastErr = timedOut ? new TimeoutError(label, timeoutMs) : err
      if (!isRetryable(lastErr) || i === retries) break
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    await sleep(retryDelayMs * (1 + Math.random() * 0.6), signal)
  }
  throw lastErr
}

/** GET or POST a URL and parse JSON, with timeout + retry. Non-2xx → HttpError. */
export function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { method = opts.body === undefined ? 'GET' : 'POST', body, headers } = opts
  return withRetry(
    async (signal) => {
      const res = await fetch(url, {
        method,
        signal,
        headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (!res.ok) {
        let text: string | undefined
        try {
          text = (await res.text()).slice(0, 300)
        } catch {
          /* body unreadable: status is enough */
        }
        throw new HttpError(res.status, url, text)
      }
      return (await res.json()) as T
    },
    { label: url, ...opts },
  )
}

/**
 * A hedged request: runs `primary`, and starts `backup` too if `primary` has not answered within `hedgeMs` (or at
 * once, if `primary` fails first). Resolves with whichever answers first; rejects with `primary`'s error only when
 * both fail. Both share a signal that is aborted as soon as there is an answer, so the loser is cancelled. For free
 * public services that are usually fast but can stall for tens of seconds: the user waits for the faster one, and the
 * backup is only asked when it is needed.
 */
export function hedge<T>(primary: (signal: AbortSignal) => Promise<T>, backup: (signal: AbortSignal) => Promise<T>, hedgeMs: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(abortReason(signal))
  const ctl = new AbortController()
  const onAbort = () => ctl.abort(signal?.reason)
  signal?.addEventListener('abort', onAbort, { once: true })
  return new Promise<T>((resolve, reject) => {
    let settled = false
    let backupStarted = false
    let failures = 0
    let primaryErr: unknown
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      fn()
      ctl.abort()
    }
    const failed = (err: unknown) => {
      if (signal?.aborted) return finish(() => reject(abortReason(signal)))
      if (++failures === 2) finish(() => reject(primaryErr ?? err))
    }
    const startBackup = () => {
      if (backupStarted || settled) return
      backupStarted = true
      backup(ctl.signal).then((v) => finish(() => resolve(v)), failed)
    }
    const timer = setTimeout(startBackup, hedgeMs)
    ctl.signal.addEventListener('abort', () => {
      if (signal?.aborted) finish(() => reject(abortReason(signal)))
    })
    primary(ctl.signal).then(
      (v) => finish(() => resolve(v)),
      (err: unknown) => {
        primaryErr = err
        failed(err)
        startBackup()
      },
    )
  })
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * Runs `fn` over `items` with at most `limit` in flight. Results keep input order.
 * Used to keep image probes and point queries polite to free public services.
 */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}
