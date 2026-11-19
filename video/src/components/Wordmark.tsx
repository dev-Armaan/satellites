/**
 * The Watched wordmark, drawn from the same outline the app, the share card and the server card use
 * (api/_lib/wordmark.ts), so the video can never drift from the product's mark.
 */
import type { FC } from 'react'
import { WORDMARK_BOX, WORDMARK_DOT, WORDMARK_PATH } from '../../../api/_lib/wordmark'

export const Wordmark: FC<{ height: number; fill: string; dot: string; dotScale?: number }> = ({ height, fill, dot, dotScale = 1 }) => {
  const [x, y, w, h] = WORDMARK_BOX
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} height={height} width={(height * w) / h} style={{ display: 'block', overflow: 'visible' }}>
      <path d={WORDMARK_PATH} fill={fill} />
      <circle cx={WORDMARK_DOT.cx} cy={WORDMARK_DOT.cy} r={WORDMARK_DOT.r * dotScale} fill={dot} />
    </svg>
  )
}
