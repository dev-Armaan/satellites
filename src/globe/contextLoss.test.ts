import { describe, expect, it } from 'vitest'
import { onContextRestored } from './contextLoss'

describe('onContextRestored', () => {
  it('calls back on every restore, and never for a loss', () => {
    const canvas = new EventTarget()
    let restored = 0
    onContextRestored(canvas, () => restored++)
    canvas.dispatchEvent(new Event('webglcontextlost'))
    expect(restored).toBe(0)
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(restored).toBe(2)
  })

  it('stops when told to: an unmounted canvas starts nothing', () => {
    const canvas = new EventTarget()
    let restored = 0
    const stop = onContextRestored(canvas, () => restored++)
    stop()
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(restored).toBe(0)
  })
})
