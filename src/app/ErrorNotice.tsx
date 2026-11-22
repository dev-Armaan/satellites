import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import enApp from '@/i18n/en/app'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { INSET_CLEAR, isStacked } from '@/lib/layout'
import { useApp } from '@/state/store'
import type { MessageRef } from '@/types'
import { Button, Label } from '@/ui/system'
import { appRefText } from './messageRefs'
import s from './ErrorNotice.module.css'

/**
 * Engine fault (phase 'error'). The place stays in the store, so "Try again" re-runs it without retyping;
 * "Back" returns to the landing. A retry that happens behind the notice (the catalog, before any search) returns a
 * promise: the button says "Trying…" until it settles, and the notice stays up if it fails again.
 *
 * Like every phase's UI, the notice publishes what it covers (store.uiInsets) so the globe frames the place
 * clear of it: beside it on wide screens (as the landing's column), above it when stacked. It never clears
 * them; the next phase's owner overwrites.
 *
 * `message` is the store's ref (src/app/messageRefs.ts), rendered here in the visitor's language, so a notice that is
 * up follows a language switch.
 */
export function ErrorNotice({ message, onRetry, onBack }: { message?: MessageRef; onRetry?: () => Promise<void> | void; onBack: () => void }) {
  const m = useMsgs(enApp)
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  useEffect(
    () => () => {
      alive.current = false
    },
    [],
  )
  const retry = () => {
    if (busy || !onRetry) return
    const r = onRetry()
    if (!r) return
    setBusy(true)
    void r.finally(() => alive.current && setBusy(false))
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const publish = () => {
      // Layout box (offset*), not getBoundingClientRect: the entrance's translateY must not skew the frame.
      // The notice's offset parent is the full-viewport layer.
      const top = el.offsetTop
      const left = el.offsetLeft
      const right = left + el.offsetWidth
      const w = window.innerWidth
      const h = window.innerHeight
      // Wide screens: the globe frames beside the card, on whichever side it docks (the left; the right if a
      // right-to-left layout mirrors it), read from where it is rather than from the language.
      const beside = left + el.offsetWidth / 2 <= w / 2 ? { left: Math.ceil(right + INSET_CLEAR), right: 0, bottom: 0 } : { right: Math.ceil(w - left + INSET_CLEAR), left: 0, bottom: 0 }
      useApp.getState().setUiInsets(isStacked(w, h) ? { bottom: Math.ceil(h - top + INSET_CLEAR), left: 0, right: 0 } : beside)
    }
    publish()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : undefined
    ro?.observe(el)
    window.addEventListener('resize', publish)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', publish)
    }
    // the language: a switch to or from Arabic moves the notice to the other side without resizing it
  }, [locale])

  return (
    <div ref={ref} className={s.wrap} role="alert">
      <Label>{m.notice.label}</Label>
      <p className={s.msg}>{appRefText(message, m) ?? m.notice.fallback}</p>
      <div className={s.actions}>
        {onRetry ? (
          <Button variant="primary" onClick={retry} disabled={busy} aria-busy={busy || undefined}>
            {busy ? m.notice.trying : m.notice.tryAgain}
          </Button>
        ) : null}
        <Button onClick={onBack}>{m.notice.back}</Button>
      </div>
    </div>
  )
}
