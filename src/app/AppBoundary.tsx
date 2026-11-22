/**
 * The app's last line: an exception thrown while React renders any part of it.
 *
 * Without a boundary React unmounts the whole root on such an error. The loading screen is long gone by then, so
 * the visitor was left on an empty ink page with nothing to press (the globe has its own boundary, GlobeCanvas's
 * SceneBoundary; nothing else had one). This one swaps the app for the fault notice: "Try again" reloads the page,
 * whose address already names the place and the pass, and "Back" goes to the landing.
 *
 * The notice is the app's own (ErrorNotice, with no message: "Something went wrong."), so it is in the visitor's
 * language and needs no new words. The error still reaches the usage stats: a boundary keeps React from reporting
 * it to the window, so it is reported here.
 */
import { Component, type ReactNode } from 'react'
import { homePath } from '@/lib/placePage'
import { dropBootCurtain } from './bootCurtain'
import { ErrorNotice } from './ErrorNotice'
import s from './App.module.css'

const reload = () => window.location.reload()
/** A full load of the landing: whatever state threw is gone with the page. */
const toLanding = () => window.location.assign(homePath(window.location.pathname))

export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    // Thrown before the app's first screen: the loading screen would otherwise stay over the notice.
    dropBootCurtain()
    // As an uncaught error would have been: the console, and the `error` event src/app/telemetry.ts listens for.
    if (typeof window.reportError === 'function') window.reportError(error)
    else console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className={s.root}>
        <div className={s.layer}>
          <ErrorNotice onRetry={reload} onBack={toLanding} />
        </div>
      </div>
    )
  }
}
