/**
 * Field: the search input (DESIGN §8). No box, just a baseline hairline that thickens on focus, and a
 * blinking block caret drawn by us (the native caret is hidden).
 *
 * The input is monospace, so the caret needs no layout reads: one cell width is measured once with a
 * canvas in the input's computed font (again when fonts finish loading and on resize), and the caret
 * sits at selectionStart × cell − scrollLeft. Moves are coalesced into one rAF per frame, driven by
 * `input` and `selectionchange` only. (A hidden mirror span is kept as the fallback for a proportional
 * font, should a caller ever restyle the input.) The caret inverts the glyph beneath it
 * (mix-blend-mode: difference), stays solid while you type, hides while a range is selected, and does
 * not blink under reduced motion. Right to left the native caret shows instead (Field.module.css says why).
 *
 *   <Field label="01 / Place" placeholder="Search a place" leading={<Glyph name="search" />}
 *          trailing={<Kbd>/</Kbd>} busy={searching} />
 *
 * All native input props pass through (value/onChange, aria-* for comboboxes, etc.), and the ref is
 * the <input>.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import { queryDir } from '@/i18n/bidi'
import { useLocale } from '@/i18n/runtime'
import { cx } from './primitives'
import s from './Field.module.css'

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Mono caps label above the line, left */
  label?: ReactNode
  /** Mono caps status above the line, right (e.g. "Searching", "3 results") */
  status?: ReactNode
  /** Keep the label + status row for assistive tech only (visually hidden), e.g. a compact phone hero */
  metaHidden?: boolean
  /** Element before the text (a Glyph) */
  leading?: ReactNode
  /** Element after the text (a Kbd hint or a button) */
  trailing?: ReactNode
  size?: 'md' | 'lg'
  /** Indeterminate activity: a short segment travels along the baseline */
  busy?: boolean
  /** Caveat state: the baseline turns --warn */
  invalid?: boolean
  className?: string
  inputClassName?: string
}

/** How long the caret stays solid after a keystroke before it resumes blinking. */
const TYPING_HOLD_MS = 600

let measureCtx: CanvasRenderingContext2D | null | undefined
/** font-stretch percentages → the keywords the canvas `font` shorthand accepts. */
const STRETCH: Record<string, string> = {
  '50%': 'ultra-condensed',
  '62.5%': 'extra-condensed',
  '75%': 'condensed',
  '87.5%': 'semi-condensed',
  '100%': 'normal',
  '112.5%': 'semi-expanded',
  '125%': 'expanded',
  '150%': 'extra-expanded',
  '200%': 'ultra-expanded',
}
/** Width of one glyph cell of the font, or 0 when it can't be measured or isn't monospace. */
function cellWidth(style: string, weight: string, stretch: string, size: string, family: string): number {
  if (measureCtx === undefined) {
    try {
      measureCtx = document.createElement('canvas').getContext('2d')
    } catch {
      measureCtx = null
    }
  }
  if (!measureCtx) return 0
  const kw = STRETCH[stretch] ?? (stretch === 'normal' ? 'normal' : '')
  if (!kw) return 0
  measureCtx.font = `${style} ${weight} ${kw} ${size} ${family}`
  // Older engines ignore the shorthand's stretch; set it explicitly where supported.
  if ('fontStretch' in measureCtx) measureCtx.fontStretch = kw as CanvasFontStretch
  const zero = measureCtx.measureText('0').width
  // Monospace check: a narrow and a wide glyph must measure the same.
  return Math.abs(measureCtx.measureText('i').width - measureCtx.measureText('W').width) < 0.01 ? zero : 0
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, status, metaHidden, leading, trailing, size = 'md', busy, invalid, className, inputClassName, id, onFocus, onBlur, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const typingTimer = useRef(0)
  /** One monospace cell (px); 0 = not monospace (or unmeasured): fall back to the mirror. */
  const cell = useRef(0)
  /** The input's inner width (px), measured with the cell. */
  const boxW = useRef(0)
  const raf = useRef(0)
  const [focused, setFocused] = useState(false)
  // Right to left, what is typed reads in its own direction (queryDir): a coordinate pair typed on an Arabic page
  // read «23.500 ,12.500». Left to right nothing changes: the block caret's arithmetic assumes a left-to-right line.
  const rtlPage = LOCALE_INFO[useLocale()].dir === 'rtl'
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, [])

  const measureCell = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const cs = getComputedStyle(input)
    // letter-spacing is 0 on this input; a non-zero value would change the advance, so fall back.
    const spacing = parseFloat(cs.letterSpacing) || 0
    cell.current = spacing ? 0 : cellWidth(cs.fontStyle, cs.fontWeight, cs.fontStretch || 'normal', cs.fontSize, cs.fontFamily)
    boxW.current = input.clientWidth
  }, [])

  /** Move the block caret. Monospace: arithmetic only. Otherwise: measure in the mirror. */
  const place = useCallback(() => {
    raf.current = 0
    const input = inputRef.current
    const caret = caretRef.current
    if (!input || !caret) return
    const value = input.value
    const start = input.selectionStart ?? value.length
    const end = input.selectionEnd ?? start
    let left: number
    let w: number
    if (cell.current > 0) {
      // While the text fits, the input cannot be scrolled: no need to read (and lay out) scrollLeft.
      const scroll = (value.length + 1) * cell.current > boxW.current ? input.scrollLeft : 0
      left = start * cell.current - scroll
      w = cell.current
    } else {
      const mirror = mirrorRef.current
      if (!mirror) return
      mirror.textContent = value.slice(0, start)
      const x = mirror.getBoundingClientRect().width
      mirror.textContent = value.slice(start, start + 1) || '0'
      w = mirror.getBoundingClientRect().width
      left = x - input.scrollLeft
    }
    caret.style.transform = `translate3d(${left}px, 0, 0)`
    caret.style.width = `${Math.max(2, w)}px`
    caret.dataset.hidden = String(start !== end || left < -1 || left > boxW.current + 1)
  }, [])

  /** Coalesce every trigger in a frame into one placement. */
  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(place)
  }, [place])

  const markTyping = useCallback(() => {
    const caret = caretRef.current
    if (!caret) return
    caret.dataset.typing = 'true'
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      if (caretRef.current) caretRef.current.dataset.typing = 'false'
    }, TYPING_HOLD_MS)
  }, [])

  // Controlled value changes (clear, choose) move the caret too.
  useLayoutEffect(() => {
    if (focused) schedule()
  }, [focused, rest.value, schedule])
  useEffect(() => {
    if (!focused) return
    const input = inputRef.current
    if (!input) return
    measureCell()
    place()
    const onSel = () => {
      if (document.activeElement === input) schedule()
    }
    const onInput = () => {
      markTyping()
      schedule()
    }
    const onResize = () => {
      measureCell()
      schedule()
    }
    document.addEventListener('selectionchange', onSel)
    input.addEventListener('input', onInput)
    input.addEventListener('scroll', onSel)
    window.addEventListener('resize', onResize)
    // Fonts swapping in after first paint change the cell width.
    void document.fonts?.ready.then(onResize)
    // The line's trailing controls come and go (clear, go): track the input's width without reading it.
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            boxW.current = entries[0]?.contentRect.width ?? boxW.current
            schedule()
          })
        : null
    ro?.observe(input)
    return () => {
      ro?.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
      document.removeEventListener('selectionchange', onSel)
      input.removeEventListener('input', onInput)
      input.removeEventListener('scroll', onSel)
      window.removeEventListener('resize', onResize)
    }
  }, [focused, place, schedule, markTyping, measureCell])
  useEffect(() => () => window.clearTimeout(typingTimer.current), [])

  return (
    <div
      className={cx(s.field, size === 'lg' && s.lg, focused && s.focused, invalid && s.invalid, rest.disabled && s.disabled, className)}
      data-busy={busy ? 'true' : undefined}
    >
      {label || status ? (
        <div className={cx(s.meta, metaHidden && s.srOnly)}>
          {label ? (
            <label className={s.label} htmlFor={id}>
              {label}
            </label>
          ) : (
            <span />
          )}
          {status ? (
            <span className={s.status} aria-live="polite">
              {status}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className={s.control}
        onPointerDown={(e) => {
          // A press on the line's padding (not on the input or a button) still focuses the input.
          if (e.target !== e.currentTarget) return
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        {leading ? <span className={s.leading}>{leading}</span> : null}
        <span className={s.inputWrap}>
          <input
            ref={inputRef}
            id={id}
            className={cx(s.input, inputClassName)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            dir={rtlPage ? queryDir(String(rest.value ?? '')) : undefined}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            {...rest}
          />
          <span ref={mirrorRef} className={s.mirror} aria-hidden />
          <span ref={caretRef} className={s.caret} data-hidden={focused ? 'false' : 'true'} aria-hidden />
        </span>
        {trailing ? <span className={s.trailing}>{trailing}</span> : null}
      </div>
      <span className={s.line} aria-hidden />
      <span className={s.lineFocus} aria-hidden />
      <span className={s.scan} aria-hidden />
    </div>
  )
})
