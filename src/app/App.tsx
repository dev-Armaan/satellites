/**
 * Integration root — owned by the integrator.
 * Dev sandboxes: append ?sandbox=<name> to render src/sandbox/<name>.tsx (default export) in isolation.
 *
 * Production imports Main statically: one request for the shell (no HTML → index.js → Main.js waterfall).
 * Dev keeps it lazy so sandbox pages never import unfinished modules.
 */
import { lazy, Suspense, useLayoutEffect, type ComponentType } from 'react'
import { AppBoundary } from './AppBoundary'
import { dropBootCurtain } from './bootCurtain'
import MainStatic from './Main'

// Sandboxes are dev-only: production builds never bundle them (or their fixtures).
const sandboxes = (import.meta.env.DEV ? import.meta.glob('../sandbox/*.tsx') : {}) as Record<
  string,
  () => Promise<{ default: ComponentType }>
>
const sandboxName = import.meta.env.DEV ? new URLSearchParams(location.search).get('sandbox') : null
const sandboxLoader = sandboxName ? sandboxes[`../sandbox/${sandboxName}.tsx`] : undefined
const Root: ComponentType = sandboxLoader ? lazy(sandboxLoader) : import.meta.env.DEV ? lazy(() => import('./Main')) : MainStatic

export function App() {
  // Sandboxes skip the loading screen (index.html's #boot-static and html[data-boot]).
  useLayoutEffect(() => {
    if (sandboxName) dropBootCurtain()
  }, [])
  if (sandboxName && !sandboxLoader)
    return (
      <pre className="t-mono" style={{ padding: 24 }}>
        No sandbox "{sandboxName}". Available: {Object.keys(sandboxes).join(', ')}
      </pre>
    )
  return (
    <AppBoundary>
      <Suspense fallback={null}>
        <Root />
      </Suspense>
    </AppBoundary>
  )
}
