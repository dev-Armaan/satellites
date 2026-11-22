import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CODECS, encodeFirstThatFits, planVideo, Unmuxable, videoFileName, VIDEO_FPS, type Chosen } from './video'

describe('the video’s plan', () => {
  it('rests on every picture and dissolves the next in over it, once through', () => {
    const { steps } = planVideo(3)
    // first rest 36, then (12 dissolving + 27 resting), then (12 dissolving + 60 resting)
    expect(steps).toHaveLength(36 + 12 + 27 + 12 + 60)
    expect(steps[0]).toEqual({ base: 0, alpha: 0 })
    expect(steps[36]).toMatchObject({ base: 0, over: 1 })
    expect(steps[36 + 12]).toEqual({ base: 1, alpha: 0 })
    expect(steps.at(-1)).toEqual({ base: 2, alpha: 0 })
  })

  it('never shows a picture at nothing or at everything while it dissolves, and only ever grows', () => {
    const fade = planVideo(2).steps.filter((s) => s.over !== undefined)
    expect(fade).toHaveLength(12)
    expect(fade[0].alpha).toBeGreaterThan(0)
    expect(fade.at(-1)!.alpha).toBeLessThan(1)
    for (let i = 1; i < fade.length; i++) expect(fade[i].alpha).toBeGreaterThan(fade[i - 1].alpha)
  })

  it('makes eleven years about sixteen seconds', () => {
    const seconds = planVideo(11).steps.length / VIDEO_FPS
    expect(seconds).toBeGreaterThan(14)
    expect(seconds).toBeLessThan(18)
  })

  it('is one resting picture for a single frame', () => {
    expect(planVideo(1).steps.every((s) => s.base === 0 && s.over === undefined)).toBe(true)
  })
})

describe('the file’s name', () => {
  const frames = [{ date: '2015-10-22' }, { date: '2021-12-01' }, { date: '2026-09-04' }]
  it('names the place and the years it spans', () => {
    expect(videoFileName('Groom Lake, Nevada', frames, 'place')).toBe('watched-groom-lake-nevada-2015-2026.mp4')
    expect(videoFileName('São Paulo', frames.slice(0, 1), 'place')).toBe('watched-sao-paulo-2015.mp4')
  })
  it('spells letters that have no decomposition as the place search does, never as a hyphen', () => {
    expect(videoFileName('Łódź', frames, 'place')).toBe('watched-lodz-2015-2026.mp4')
    expect(videoFileName('Kırıkkale', frames, 'place')).toBe('watched-kirikkale-2015-2026.mp4')
    expect(videoFileName('Ørsted', frames, 'place')).toBe('watched-orsted-2015-2026.mp4')
    expect(videoFileName('Þingvellir, Ísland', frames, 'place')).toBe('watched-thingvellir-island-2015-2026.mp4')
    expect(videoFileName('Straße des 17. Juni', frames, 'place')).toBe('watched-strasse-des-17-juni-2015-2026.mp4')
    expect(videoFileName('İstanbul', frames, 'place')).toBe('watched-istanbul-2015-2026.mp4')
    // English names, as before.
    expect(videoFileName('St. John’s, Newfoundland', frames, 'place')).toBe('watched-st-john-s-newfoundland-2015-2026.mp4')
  })
  it('cuts a long name at 40 characters, never leaving a hyphen at the cut', () => {
    const welsh = 'Llanfairpwllgwyngyllgogerychwyrndrobwll Llantysiliogogogoch' // 39 letters, then the space
    expect(videoFileName(welsh, frames, 'place')).toBe('watched-llanfairpwllgwyngyllgogerychwyrndrobwll-2015-2026.mp4')
    expect(videoFileName('Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu', frames, 'place')).toBe(
      'watched-taumatawhakatangihangakoauauotamateaturi-2015-2026.mp4',
    )
  })
  it('still has a name for a place written in another script, or with no frames', () => {
    expect(videoFileName('東京', frames, 'place')).toBe('watched-place-2015-2026.mp4')
    expect(videoFileName('Oslo', [], 'place')).toBe('watched-oslo.mp4')
  })
})

/**
 * A stand-in for the browser's VideoEncoder, per codec: 'in-order' hands each frame back at once; 'b-frames' holds
 * three and hands the fourth over first, in decode order with presentation times (I0 P4 B1 B2 B3 P8 B5 …), as the
 * encoders behind the 2026-11-21 errors did; 'late-start' starts its times 50 ms in; 'error' fails on its own.
 */
type Behaviour = 'in-order' | 'b-frames' | 'late-start' | 'error'
let behaviour: Record<string, Behaviour> = {}
let configured: string[] = []

class FakeFrame {
  timestamp: number
  duration: number
  constructor(_src: unknown, init: { timestamp: number; duration: number }) {
    this.timestamp = init.timestamp
    this.duration = init.duration
  }
  close() {}
}

class FakeChunk {
  constructor(
    readonly type: 'key' | 'delta',
    readonly timestamp: number,
    readonly duration: number,
    private bytes: Uint8Array,
  ) {}
  get byteLength() {
    return this.bytes.length
  }
  copyTo(dst: Uint8Array) {
    dst.set(this.bytes)
  }
}

class FakeEncoder {
  state = 'unconfigured'
  encodeQueueSize = 0
  private codec = ''
  private held: { t: number; d: number; key: boolean }[] = []
  private sent = 0
  constructor(private init: { output: (chunk: unknown, meta?: unknown) => void; error: (e: Error) => void }) {}
  configure(c: { codec: string }) {
    this.codec = c.codec
    this.state = 'configured'
    configured.push(c.codec)
  }
  private emit(f: { t: number; d: number; key: boolean }) {
    const shift = behaviour[this.codec] === 'late-start' ? 50_000 : 0
    const bytes = new Uint8Array([0, 0, 0, 1, 0x65, 0x88, 0x84, 0x00])
    const chunk = new FakeChunk(f.key ? 'key' : 'delta', f.t + shift, f.d, bytes)
    const meta = this.sent++ === 0 ? { decoderConfig: { codec: this.codec, codedWidth: 64, codedHeight: 64, description: new Uint8Array([1, 0x64, 0, 0x28, 0xff, 0xe1, 0, 0]) } } : undefined
    this.init.output(chunk, meta)
  }
  encode(frame: FakeFrame, o: { keyFrame?: boolean }) {
    const f = { t: frame.timestamp, d: frame.duration, key: !!o.keyFrame || this.sent === 0 }
    const how = behaviour[this.codec] ?? 'in-order'
    if (how === 'error') return this.init.error(new Error('EncodingError: the hardware encoder stopped'))
    if (how !== 'b-frames' || f.key) {
      this.held.forEach((h) => this.emit(h))
      this.held = []
      return this.emit(f)
    }
    this.held.push(f)
    if (this.held.length === 4) {
      const [b1, b2, b3, p] = this.held
      this.held = []
      ;[p, b1, b2, b3].forEach((h) => this.emit(h))
    }
  }
  async flush() {
    this.held.forEach((h) => this.emit(h))
    this.held = []
  }
  close() {
    this.state = 'closed'
  }
}

const candidates: Chosen[] = CODECS.map((c) => ({ config: { codec: c.codec, width: 64, height: 64, bitrate: 1e6, framerate: VIDEO_FPS }, mux: c.mux }))
const frameAt = () => ({}) as CanvasImageSource
const box = (buf: ArrayBuffer, at: number) => new TextDecoder().decode(new Uint8Array(buf, at, 4))
const hasBox = (buf: ArrayBuffer, name: string) => new TextDecoder('latin1').decode(new Uint8Array(buf)).includes(name)

describe('encoding: a codec whose chunks the file cannot hold', () => {
  beforeEach(() => {
    behaviour = {}
    configured = []
    vi.stubGlobal('VideoEncoder', FakeEncoder)
    vi.stubGlobal('VideoFrame', FakeFrame)
    vi.stubGlobal('EncodedVideoChunk', FakeChunk)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses the first codec when its chunks come in order', async () => {
    const refused = new Set<string>()
    const { buffer, chosen } = await encodeFirstThatFits(candidates, 90, frameAt, { refused })
    expect(chosen.config.codec).toBe('avc1.640028')
    expect(configured).toEqual(['avc1.640028'])
    expect(box(buffer, 4)).toBe('ftyp')
    expect(hasBox(buffer, 'moov')).toBe(true)
    expect(refused.size).toBe(0)
  })

  it('moves on from encoders that reorder frames to Baseline H.264, and remembers the ones it left', async () => {
    behaviour = { 'avc1.640028': 'b-frames', 'avc1.4d0028': 'b-frames' }
    const refused = new Set<string>()
    const { buffer, chosen } = await encodeFirstThatFits(candidates, 90, frameAt, { refused })
    expect(configured).toEqual(['avc1.640028', 'avc1.4d0028', 'avc1.42e028'])
    expect(chosen).toMatchObject({ mux: 'avc', config: { codec: 'avc1.42e028' } })
    expect(box(buffer, 4)).toBe('ftyp')
    expect([...refused]).toEqual(['avc1.640028', 'avc1.4d0028'])
  })

  it('keeps an encoder whose times start past zero: the file starts at its first frame', async () => {
    behaviour = { 'avc1.640028': 'late-start' }
    const { chosen } = await encodeFirstThatFits(candidates, 90, frameAt, { refused: new Set() })
    expect(chosen.config.codec).toBe('avc1.640028')
  })

  it('fails with the last refusal when no codec makes a file it can hold', async () => {
    behaviour = Object.fromEntries(CODECS.map((c) => [c.codec, 'b-frames' as const]))
    await expect(encodeFirstThatFits(candidates, 90, frameAt, { refused: new Set() })).rejects.toBeInstanceOf(Unmuxable)
    expect(configured).toHaveLength(CODECS.length)
  })

  it('does not try another codec after the encoder’s own error, or an abort', async () => {
    behaviour = { 'avc1.640028': 'error' }
    await expect(encodeFirstThatFits(candidates, 90, frameAt, { refused: new Set() })).rejects.toThrow(/hardware encoder/)
    expect(configured).toEqual(['avc1.640028'])

    configured = []
    behaviour = {}
    const ctl = new AbortController()
    ctl.abort()
    await expect(encodeFirstThatFits(candidates, 90, frameAt, { refused: new Set(), signal: ctl.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(configured).toEqual(['avc1.640028'])
  })
})
