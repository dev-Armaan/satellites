import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/scripts.css'
import './styles/base.css'
import './styles/static.css'
import { App } from './app/App'
import * as telemetryDeps from './app/telemetryDeps'
import { startLocale } from './i18n/runtime'
import { showTextToReader } from './lib/reader'
import { installStaleBuildReload } from './lib/staleBuild'

// A search engine or an assistant reads the page's own text (the build wrote it into #root), and the app never starts:
// its results take longer than a crawler's renderer waits (src/lib/reader.ts). Everyone else gets the app.
if (!showTextToReader(navigator.userAgent, document)) {
  // Page views are counted by the host (Cloudflare Web Analytics adds its own beacon), so the app loads no analytics
  // script of its own. Production only.
  if (import.meta.env.PROD) {
    // A tab left open across a deploy reloads once onto the new build instead of failing a lazy import.
    installStaleBuildReload()
    // In-app events (src/app/telemetry.ts): its own chunk, after first paint, so it never competes with boot.
    const telemetry = () => void import('./app/telemetry').then((m) => m.initTelemetry(telemetryDeps), () => undefined)
    if ('requestIdleCallback' in window) requestIdleCallback(telemetry, { timeout: 5000 })
    else setTimeout(telemetry, 2500)
  }

  // The language index.html chose: its messages are already downloading (modulepreload), so this rarely waits, and the
  // first render is in that language (never English first). English has nothing to load.
  await startLocale()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
