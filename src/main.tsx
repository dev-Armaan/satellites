import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import { App } from './app/App'
import * as telemetryDeps from './app/telemetryDeps'
import { installStaleBuildReload } from './lib/staleBuild'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
