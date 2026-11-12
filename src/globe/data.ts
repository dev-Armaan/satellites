/**
 * The globe's single seam onto the engine. Every engine import in src/globe goes through this file, so the
 * integrator can swap the implementation (worker-backed, mocked in tests) without touching scene code.
 */
import { useEffect, useState } from 'react'
import {
  buildElementBuffer,
  CATEGORY_INDEX,
  ELEMENT_STRIDE,
  FLAG_FEATURED,
  getSatInfo,
  groundTrack,
  keplerJ2World,
  loadCatalog,
  profileFor,
  propagate,
  scanAngleAt,
  scanLine,
  scanSeatOf,
  type ElementBuffer,
  type LoadedCatalog,
  type SatState,
  type ScanLine,
} from '@/engine'

export {
  CATEGORY_INDEX,
  ELEMENT_STRIDE,
  FLAG_FEATURED,
  getSatInfo,
  groundTrack,
  keplerJ2World,
  profileFor,
  propagate,
  scanAngleAt,
  scanLine,
  scanSeatOf,
  type ElementBuffer,
  type LoadedCatalog,
  type SatState,
  type ScanLine,
}

export interface CatalogBuffers {
  catalog: LoadedCatalog
  elements: ElementBuffer
  /** NORAD → index into the element buffer */
  indexOf: Map<number, number>
}

let cached: Promise<CatalogBuffers> | undefined

/** Load the catalog (shared singleton with the engine) and pack it for the GPU, once per page. */
export function loadCatalogBuffers(): Promise<CatalogBuffers> {
  if (!cached) {
    cached = loadCatalog().then((catalog) => {
      const elements = buildElementBuffer(catalog)
      const indexOf = new Map<number, number>()
      for (let i = 0; i < elements.count; i++) indexOf.set(elements.norad[i], i)
      return { catalog, elements, indexOf }
    })
    // A failed load must not poison the cache: a later mount retries.
    cached.catch(() => {
      cached = undefined
    })
  }
  return cached
}

export type CatalogStatus =
  | { state: 'loading' }
  | { state: 'ready'; data: CatalogBuffers }
  | { state: 'error'; error: Error }

/** React binding for {@link loadCatalogBuffers}. Retries with backoff on failure (flaky mobile networks). */
export function useCatalogBuffers(): CatalogStatus {
  const [status, setStatus] = useState<CatalogStatus>({ state: 'loading' })
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const attempt = (n: number) => {
      loadCatalogBuffers().then(
        (data) => alive && setStatus({ state: 'ready', data }),
        (err: unknown) => {
          if (!alive) return
          setStatus({ state: 'error', error: err instanceof Error ? err : new Error(String(err)) })
          if (n < 4) timer = setTimeout(() => attempt(n + 1), 2000 * 2 ** n)
        },
      )
    }
    attempt(0)
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [])
  return status
}
