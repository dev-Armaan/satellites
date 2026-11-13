/**
 * The phone's back gesture (and the browser's Back) closes the top layer instead of leaving the site.
 *
 * Every layer that covers what was there before (the results of a search, an open pass, the photo viewer, the share
 * sheet, About, the search modes) owns ONE history entry while it is open. The entries are stamped with this page
 * load's id and their DEPTH (how many layers are open there), so every move is read from where the browser actually is:
 *  - a traversal to depth d (Back, a swipe, a long-press jump over several entries) closes layers, top first, until d
 *    are left open; it never opens anything;
 *  - a Forward into an entry whose layer is gone (depth above what is open) is undone at once: Forward never reopens
 *    and never closes;
 *  - closing a layer from the UI (×, swipe down, Esc, "All passes", "New search") takes its entry off; opens and closes
 *    in one tick net out to one history move (search mode → results moves nothing), and when that move lands the app
 *    is asked to rewrite the address bar for what is on screen (`onSettled`), whatever an earlier write left on the
 *    entry it lands on;
 *  - the app's own moves never go below this load's first entry, so the app itself never navigates off the site;
 *  - history.go is relative and resolved when the browser gets to it, so the app's moves go one at a time: a close
 *    from the UI moves in its own tick (ahead of a Back pressed after it), a dead Forward's undo from a fresh task
 *    (after a Back the user pressed right after it has landed); a user move that lands while one is queued is
 *    read once the app's has landed too, and entries are put above the user's so the app's lands back on it; after
 *    MOVE_TIMEOUT_MS a move not landed yet stops holding later changes back, and is never issued again (a late
 *    landing is read by its depth).
 * Layers stack in their drawn order (results < pass < search < lightbox < share < about), not in the order they opened:
 * a pass a share link selects while About is up goes under About, so Back closes what is on top.
 * A deep or share link opens straight onto results: when those results actually open, a landing entry is slipped in
 * under them, so Back from a shared link lands on Watched's landing instead of leaving (not on a reload: the history
 * already has its entries).
 *
 * Pure core (createBackStack) with the browser wiring around it; the rules are unit-tested (backStack.test.ts).
 */
import { useEffect, useRef } from 'react'

export interface HistoryLike {
  pushState(data: unknown, unused: string, url?: string | null): void
  replaceState(data: unknown, unused: string, url?: string | null): void
  go(delta: number): void
  readonly state: unknown
  /** The current entry's URL (path + search + hash) */
  url(): string
}

export interface LayerToken {
  readonly id: number
  readonly name: string
  /** Set when a traversal closed it: its entry is already gone. */
  popped: boolean
}

export interface BackStackOptions {
  /** Runs the batched history move after the current tick's opens and closes (a microtask in the browser). */
  schedule: (fn: () => void) => void
  /**
   * A timer (setTimeout in the browser); returns its cancel. A dead Forward's undo runs from a fresh task (after a
   * traversal the user queued right after it has landed), and an app move not landed after a timeout stops holding
   * later changes back.
   */
  later?: (fn: () => void, ms: number) => () => void
  /** This tab's id (sessionStorage): entries stamped by this tab, in this load or an earlier one, are ours. */
  sid: string
  /** A deep link's first layer ('results'): when it opens on this tab's first entry, a landing goes under it. */
  deep?: string
  /** The address bar for what is on screen: after the app's own moves and after every traversal. */
  onSettled?: () => void
}

export interface BackStack {
  /** A layer opened. */
  open(name: string, close: () => void): LayerToken
  /** A layer closed (by the UI, or by a traversal). */
  closed(token: LayerToken): void
  /** The browser moved (popstate) to an entry with this state. Returns the names of the layers it closed. */
  onPop(state: unknown): string[]
  /** Line the history up with the layers open (after a reload restored fewer layers than it found entries). */
  reconcile(): void
  /** Names of the open layers, bottom first (tests). */
  names(): string[]
}

export const MARK = 'watched-layer'
/** An app move that has not landed by then stops holding later changes back (it is never issued twice). */
export const MOVE_TIMEOUT_MS = 1000
/** How long a move the timeout gave up on may still land and be read as the app's */
const LATE_FORGET_MS = 10_000

/** Drawn order of the layers, bottom first: a layer opens beneath any open layer drawn above it. Unknown names go on top. */
export const LAYER_RANK: Readonly<Record<string, number>> = { results: 0, pass: 1, search: 2, lightbox: 3, timelapse: 4, share: 5, about: 6 }
const rankOf = (name: string) => LAYER_RANK[name] ?? Number.MAX_SAFE_INTEGER
type Stamp = { s: string; d: number }

/** The stamp on a history state, if it is this tab's. */
export function stampOf(state: unknown, sid: string): Stamp | undefined {
  const m = (state as Record<string, unknown> | null)?.[MARK] as Stamp | undefined
  return m && typeof m === 'object' && m.s === sid && Number.isFinite(m.d) ? m : undefined
}

/** A history state with a stamp, keeping whatever else is there. */
const stamped = (state: unknown, s: string, d: number) => ({ ...((state as object | null) ?? {}), [MARK]: { s, d } })

export function createBackStack(h: HistoryLike, o: BackStackOptions): BackStack {
  const stack: { token: LayerToken; close: () => void; own: boolean }[] = []
  let nextId = 1
  // Where the browser is. A load that finds this tab's stamp on its entry (a reload, a return that was not kept in the
  // back-forward cache) starts at that depth, and the layers it restores from the address (results, a pass) take the
  // entries already there instead of pushing more.
  const found = stampOf(h.state, o.sid)
  /** Depth of the entry in view (0 = this tab's first entry for the site) */
  let cur = found?.d ?? 0
  /** Entries above the base this load found and its first layers adopt */
  let adoptable = cur
  if (!found) h.replaceState(stamped(h.state, o.sid, 0), '')
  /** A deep link on the base entry: its results open over a slipped-in landing */
  let slip = o.deep !== undefined && cur === 0 ? o.deep : undefined
  const later = o.later ?? ((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    return () => clearTimeout(t)
  })
  /** The app's move (history.go) on its way, if any (one at a time): its delta and the depth it lands on */
  let moving = false
  let movingDelta = 0
  let expected = 0
  /** A user traversal landed while the app's move was on its way: read it once that has landed */
  let userMoved = false
  let cancelTimeout: (() => void) | null = null
  /** Moves the timeout stopped waiting for, still on their way (a popstate from one is the app's, not the user's) */
  let late = 0
  let cancelLate: (() => void) | null = null
  /** A move waiting for its fresh task */
  let movePending = false
  /** The next move follows a traversal (a dead Forward's undo): it waits for a fresh task, behind a Back the user may
   *  have pressed right after. A move the UI starts (×, "All passes", New search) goes in the tick that closed the
   *  layer, ahead of a Back pressed after it: Chromium drops an app history.go requested while a user traversal is
   *  pending, so a later one would lose that Back. */
  let afterTraversal = false
  /** A change arrived while a move was outstanding: flush again when it lands */
  let dirty = false
  let scheduled = false

  /** Layers holding an entry of their own */
  const owned = () => stack.reduce((n, e) => n + (e.own ? 1 : 0), 0)
  const depthOf = (state: unknown) => stampOf(state, o.sid)?.d ?? 0

  /** Issue the move down to what is open. */
  const move = () => {
    movePending = false
    if (moving) {
      dirty = true
      return
    }
    const target = owned()
    if (target >= cur) return
    // Never below the base (target ≥ 0): the app never navigates off the site itself.
    const delta = target - cur
    moving = true
    movingDelta = delta
    expected = target
    cur = target
    cancelTimeout?.()
    cancelTimeout = later(onTimeout, MOVE_TIMEOUT_MS)
    h.go(delta)
  }
  /**
   * A move not landed by now is slow (a long task, a backgrounded tab), or very rarely dropped. It is never issued
   * again: still queued, it lands later, and a second one would close a layer more (or leave the site). The stack only
   * stops waiting for it: changes held behind it go ahead, and a late popstate is read by the depth it lands on.
   */
  const onTimeout = () => {
    cancelTimeout = null
    if (!moving) return
    late++
    // One a browser really dropped never lands: after a while, stop expecting it.
    cancelLate?.()
    cancelLate = later(() => {
      late = 0
      cancelLate = null
    }, LATE_FORGET_MS)
    moving = false
    movingDelta = 0
    if (userMoved) {
      // The user's move was waiting for ours: read it now, at the user's depth (CR-2; not the entries put above it).
      // Close what is above it, but issue no move: ours may still land (it is late, and read by its depth then).
      userMoved = false
      dirty = false
      cur = expected
      while (owned() > expected) {
        const top = stack.pop()!
        top.token.popped = true
        top.close()
      }
      o.schedule(() => o.onSettled?.())
      return
    }
    if (dirty) {
      dirty = false
      change()
    }
  }

  const flush = () => {
    scheduled = false
    if (moving) {
      dirty = true
      return
    }
    adoptable = 0 // the restore is over: from here on, entries follow the layers
    const target = owned()
    if (target > cur) {
      for (let d = cur + 1; d <= target; d++) h.pushState(stamped(null, o.sid, d), '')
      cur = target
      o.onSettled?.()
    } else if (target < cur && !movePending) {
      if (afterTraversal) {
        movePending = true
        later(move, 0)
      } else move()
    }
    afterTraversal = false
  }
  const change = () => {
    if (scheduled) return
    scheduled = true
    o.schedule(flush)
  }
  /** After a traversal's closes have run: the address bar for what is on screen, and any change that waited. */
  const settle = () =>
    o.schedule(() => {
      o.onSettled?.()
      if (owned() !== cur) change()
      // A traversal that needed no further move leaves nothing to undo: the next close from the UI moves in its own
      // tick again (a Back right after it must not be lost, as on 72f00ca).
      else afterTraversal = false
    })

  /** The browser is at depth d, whoever moved it there: close layers above it; a Forward into a dead entry is undone. */
  const traverse = (d: number): string[] => {
    afterTraversal = true
    cur = d
    adoptable = 0
    const closedNames: string[] = []
    while (owned() > d) {
      const top = stack.pop()!
      top.token.popped = true
      top.close()
      closedNames.push(top.token.name)
    }
    // d above what is open (a Forward into an entry whose layer is gone): settle's change takes it back down.
    settle()
    return closedNames
  }

  return {
    open(name, close) {
      const token: LayerToken = { id: nextId++, name, popped: false }
      if (slip === name && stack.length === 0) {
        // The deep link's results are opening on the base entry: a landing entry goes under it.
        const url = h.url()
        h.replaceState(stamped(h.state, o.sid, 0), '', '/')
        h.pushState(stamped(null, o.sid, 1), '', url)
        cur = 1
        slip = undefined
        stack.push({ token, close, own: true })
        return token
      }
      slip = undefined
      // Beneath any open layer drawn above it (F2): Back must close what is on top. Depth is all an entry carries, so
      // the history needs no change.
      const r = rankOf(name)
      const at = stack.findIndex((e) => rankOf(e.token.name) > r)
      stack.splice(at < 0 ? stack.length : at, 0, { token, close, own: true })
      if (adoptable > 0) adoptable-- // a restored layer: its entry is already there
      else change()
      return token
    },
    closed(token) {
      const i = stack.findIndex((e) => e.token === token)
      if (i < 0) return
      const [e] = stack.splice(i, 1)
      if (!token.popped && e.own) change()
    },
    onPop(state) {
      const d = depthOf(state)
      if (moving && late > 0 && d !== expected) {
        // A move the timeout stopped waiting for has landed; the current one is still on its way.
        late--
        return []
      }
      if (!moving && late > 0) late--
      if (!moving) return traverse(d)
      const landed = () => {
        moving = false
        movingDelta = 0
        cancelTimeout?.()
        cancelTimeout = null
      }
      if (!userMoved && d === expected) {
        // Ours landed.
        landed()
        settle()
        if (dirty) {
          dirty = false
          change()
        }
        return []
      }
      if (userMoved && d <= expected) {
        // Ours landed: back on the user's entry, or below it (where the browser picked its target when go() was
        // called, or applied the entries put above after it, CR-3). Read the browser's depth now.
        landed()
        userMoved = false
        dirty = false
        return traverse(d)
      }
      if (userMoved) return [] // the user moved again, up: ours is still on its way; nothing more is put above
      // The user's traversal landed first; ours is still queued and will resolve from here. Put entries above so it
      // lands back on this one (instead of below it, or off the site), once per move, and read the user's move then.
      for (let i = 1; i <= -movingDelta; i++) h.pushState(stamped(null, o.sid, d + i), '')
      expected = d
      cur = d
      userMoved = true
      return []
    },
    reconcile() {
      if (owned() !== cur) change()
    },
    names: () => stack.map((e) => e.token.name),
  }
}

// ───────────────────────────── browser wiring ─────────────────────────────

let instance: BackStack | null = null
let settledListener: (() => void) | null = null
let popListener: ((e: PopStateEvent) => void) | null = null

const TAB_KEY = 'watched.backStack.tab'
const NAME_PREFIX = 'watched-tab:'
const TAB_ID_RE = /^[0-9a-z]{4,16}$/

/**
 * This tab's id, kept for the tab's life so a reload knows the entries it pushed before: sessionStorage, else the stamp
 * on the entry in view. Only where sessionStorage is blocked (Safari's "Block All Cookies", some in-app browsers) does
 * window.name carry it, written only when empty or already ours (CR-5: no id in window.name for anyone else). Only a
 * tab with none of them mints a new one (F4).
 */
export function resolveTabId(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  state: unknown,
  win: { name: string },
  mint: () => string = () => Math.random().toString(36).slice(2, 10),
): string {
  const valid = (v: unknown) => (typeof v === 'string' && TAB_ID_RE.test(v) ? v : undefined)
  let storageOk = !!storage
  let fromStorage: string | undefined
  try {
    fromStorage = valid(storage?.getItem(TAB_KEY))
  } catch {
    storageOk = false
  }
  const fromState = valid(((state as Record<string, unknown> | null)?.[MARK] as Stamp | undefined)?.s)
  let fromName: string | undefined
  if (!storageOk) {
    try {
      fromName = valid(win.name.startsWith(NAME_PREFIX) ? win.name.slice(NAME_PREFIX.length) : undefined)
    } catch {
      // ignore
    }
  }
  const id = fromStorage ?? fromState ?? fromName ?? mint()
  if (storageOk && fromStorage !== id) {
    try {
      storage!.setItem(TAB_KEY, id)
    } catch {
      storageOk = false
    }
  }
  if (!storageOk) {
    try {
      if (!win.name || win.name.startsWith(NAME_PREFIX)) win.name = NAME_PREFIX + id
    } catch {
      // ignore
    }
  }
  return id
}

function tabId(): string {
  let storage: Storage | null = null
  try {
    storage = sessionStorage
  } catch {
    // access itself throws when storage is blocked
  }
  return resolveTabId(storage, history.state, window)
}

/** The page's back stack (created on first use; inert outside a browser). */
export function backStack(): BackStack | null {
  if (instance || typeof window === 'undefined' || typeof history === 'undefined') return instance
  const deep = location.pathname === '/' && /[?&](q|s)=/.test(location.search)
  const h: HistoryLike = {
    pushState: (d, u, url) => history.pushState(d, u, url),
    replaceState: (d, u, url) => history.replaceState(d, u, url),
    go: (n) => history.go(n),
    get state() {
      return history.state
    },
    url: () => location.pathname + location.search + location.hash,
  }
  instance = createBackStack(h, {
    schedule: (fn) => queueMicrotask(fn),
    later: (fn, ms) => {
      const t = setTimeout(fn, ms)
      return () => clearTimeout(t)
    },
    sid: tabId(),
    deep: deep ? 'results' : undefined,
    onSettled: () => settledListener?.(),
  })
  const s = instance
  popListener = (e) => {
    s.onPop(e.state)
  }
  window.addEventListener('popstate', popListener)
  return instance
}

// Development: a hot update starts a fresh stack (the old listener would keep reading a stale one).
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (popListener) window.removeEventListener('popstate', popListener)
    popListener = null
    instance = null
  })
}

/** The app's address-bar writer: called after the back stack's own moves and after every traversal. */
export function onBackSettled(fn: () => void) {
  settledListener = fn
}

/**
 * A layer owned by a component: while `open`, it holds a history entry and Back runs `close`. The latest `close` is
 * used (no need to memoise it). Returns `release`: a close that animates out (the photo viewer's shrink) gives its
 * entry up as the close starts, so a Back during the animation goes to the layer under it.
 */
export function useBackLayer(name: string, open: boolean, close: () => void): () => void {
  const closeRef = useRef(close)
  closeRef.current = close
  const tokenRef = useRef<LayerToken | null>(null)
  const releaseRef = useRef(() => {
    const s = backStack()
    if (s && tokenRef.current) s.closed(tokenRef.current)
    tokenRef.current = null
  })
  useEffect(() => {
    const s = backStack()
    if (!open || !s) return
    tokenRef.current = s.open(name, () => closeRef.current())
    const release = releaseRef.current
    return release
  }, [name, open])
  return releaseRef.current
}

/**
 * A layer driven by store state (results, an open pass): `isOpen` is read on every change, `close` runs on Back.
 * Returns the unsubscribe (which also gives an open layer's entry up).
 */
export function watchLayer<S>(
  subscribe: (listener: (state: S, prev: S) => void) => () => void,
  get: () => S,
  name: string,
  isOpen: (state: S) => boolean,
  close: () => void,
): () => void {
  const s = backStack()
  if (!s) return () => undefined
  let token: LayerToken | null = isOpen(get()) ? s.open(name, close) : null
  const unsub = subscribe((state) => {
    const open = isOpen(state)
    if (open && !token) token = s.open(name, close)
    else if (!open && token) {
      s.closed(token)
      token = null
    }
  })
  return () => {
    unsub()
    if (token) s.closed(token)
    token = null
  }
}
