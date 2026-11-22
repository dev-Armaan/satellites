/**
 * Asking CelesTrak for GP data the way its usage policy asks machine clients to (celestrak.org/usage-policy.php).
 *
 * Why it works the way it does:
 *
 *  - Any answer but 200 ends the run's asking at once (`Refused`). CelesTrak answers 301, 403, 404 or 50x to a client
 *    over its limits or on an old address, asks software to stop querying on any of them, and sends an address that
 *    keeps asking to its firewall. The bot used to ask three more times within 25 s of a 403 (2026-11-20). A GitHub
 *    runner's address is shared with other people's jobs, so a 403 may not even be ours: the retry is the next
 *    scheduled run, hours later and likely from another address (.github/workflows/catalog.yml).
 *  - Only a request that got no answer (the connection cut, or the time limit) is asked again, after a pause, and only
 *    while the run's time lasts. A 200 whose body is not a list of elements is an answer too: asking again would get
 *    the same, so it is not.
 *  - Every request has a time limit, headers and body alike: on 2026-11-21 a download hung until the job's 10-minute
 *    timeout cancelled the run, with no second try. The run's deadline keeps every try inside the job's time, so a
 *    slow optional group can never cost the run the catalog it already has.
 *
 * No dependencies: the workflow runs the script with `npx tsx`, without installing the project's packages.
 */

export interface Omm {
  OBJECT_NAME: string
  OBJECT_ID: string
  EPOCH: string
  MEAN_MOTION: number
  ECCENTRICITY: number
  INCLINATION: number
  RA_OF_ASC_NODE: number
  ARG_OF_PERICENTER: number
  MEAN_ANOMALY: number
  NORAD_CAT_ID: number
  BSTAR: number
  MEAN_MOTION_DOT: number
  MEAN_MOTION_DDOT: number
}

/** CelesTrak answered, and not with 200: ask it nothing more this run. */
export class Refused extends Error {
  override name = 'Refused'
  constructor(readonly status: number, statusText: string) {
    super(`${status} ${statusText}`.trim())
  }
}

/** CelesTrak answered 200 with something that is not a list of elements: asking again would get the same. */
export class NotElements extends Error {
  override name = 'NotElements'
}

export interface AskOptions {
  /** Epoch ms by which every request must be over (the run's time, inside the job's timeout) */
  deadline: number
  /** One request's limit, ms (default 120 s: a full download takes seconds when CelesTrak is well) */
  attemptMs?: number
  /** Tries for a request that got no answer (default 3) */
  attempts?: number
  /** Pause before each retry, ms (default 10 s, then 30 s) */
  pausesMs?: readonly number[]
  fetch?: typeof fetch
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  /** The signal that ends one request after `ms` (default AbortSignal.timeout) */
  timeout?: (ms: number) => AbortSignal
  log?: (line: string) => void
}

export const USER_AGENT = 'overflight-catalog-bot/1.0 (+https://github.com/dev-Armaan/satellites)'

const reason = (e: unknown) => (e instanceof Error ? (e.name === 'TimeoutError' || e.name === 'AbortError' ? 'no answer in time' : e.message) : String(e))

/** One GP group as OMM JSON. Rejects with `Refused` (stop asking), `NotElements`, or the last failure to get an answer. */
export async function fetchGroup(group: string, o: AskOptions): Promise<Omm[]> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=json`
  const get = o.fetch ?? fetch
  const now = o.now ?? Date.now
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const log = o.log ?? ((line: string) => console.warn(line))
  const attempts = o.attempts ?? 3
  const pauses = o.pausesMs ?? [10_000, 30_000]
  let last: unknown = new Error(`no time left to ask for ${group}`)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const left = o.deadline - now()
    if (left < 5_000) break
    let res: Response
    let text: string
    try {
      const signal = (o.timeout ?? AbortSignal.timeout)(Math.min(o.attemptMs ?? 120_000, left))
      res = await get(url, { headers: { 'user-agent': USER_AGENT }, signal })
      if (!res.ok) throw new Refused(res.status, res.statusText)
      text = await res.text()
    } catch (e) {
      if (e instanceof Refused) throw e
      last = e
      log(`[catalog] ${group} attempt ${attempt + 1} got no answer: ${reason(e)}`)
      if (attempt + 1 === attempts) break
      // No time for the pause: stop rather than ask again at once (a cut download may have counted as one).
      const pause = pauses[Math.min(attempt, pauses.length - 1)] ?? 0
      if (o.deadline - now() < pause + 5_000) break
      await sleep(pause)
      continue
    }
    if (!text.trim().startsWith('[')) throw new NotElements(`unexpected body for ${group}: ${text.slice(0, 120)}`)
    return JSON.parse(text) as Omm[]
  }
  throw last
}

/** Whether a catalog fetched at `fetchedAt` (ISO) is younger than `hours`: a scheduled run then has nothing to do. */
export function isFresh(fetchedAt: string | undefined, hours: number, now: number = Date.now()): boolean {
  const t = fetchedAt ? Date.parse(fetchedAt) : NaN
  return Number.isFinite(t) && now - t >= 0 && now - t < hours * 3_600_000
}
