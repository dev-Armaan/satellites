/**
 * Fits a display line to a width. The poster look depends on lines that run exactly from margin to margin whatever
 * they say, which no fixed size can give across thirty different phrases.
 */
import { fitText } from '@remotion/layout-utils'
import { SANS, SERIF } from './theme'

/** The font size at which `text`, set as display type, is `width` wide (never above `max`). */
export function fitDisplay(text: string, width: number, max = 1000): number {
  const { fontSize } = fitText({
    text,
    withinWidth: width,
    fontFamily: SANS,
    fontWeight: 580,
    letterSpacing: '-0.02em',
    additionalStyles: { fontStretch: '75%' },
  })
  return Math.min(fontSize, max)
}

/** The same for the serif accent. */
export function fitAccent(text: string, width: number, max = 1000): number {
  const { fontSize } = fitText({
    text,
    withinWidth: width,
    fontFamily: SERIF,
    fontWeight: 400,
    letterSpacing: '-0.015em',
    additionalStyles: { fontStyle: 'italic' },
  })
  return Math.min(fontSize, max)
}
