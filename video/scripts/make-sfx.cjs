/**
 * Makes the video's sound effects (public/sfx/*.wav): three sounds, synthesised here from sines and noise.
 *
 * Why synthesised and not taken from a library: under a famous song an effect has to be plain to be tasteful, a low
 * hit, a swell of noise, a key, and nothing recorded, themed or funny. Made from arithmetic they are also the
 * project's own (no licence to track), identical on every run (the noise is seeded), and tuned by editing a number
 * here. There were more (ticks, a shutter, swishes, a rattle under the counting number that creaked like a door);
 * the owner cut every one that did not add something, and src/sound.tsx says what each survivor is for.
 *
 *   node scripts/make-sfx.cjs
 *
 * The files are small and are committed, so a render needs no extra step. Where each one plays is decided next to the
 * picture it belongs to (a scene's `…_CUES`), and src/sound.tsx plays them.
 */
const fs = require('node:fs')
const path = require('node:path')

const RATE = 48000
const OUT = path.join(__dirname, '..', 'public', 'sfx')
const TAU = 2 * Math.PI

// A small seeded generator (mulberry32), so the noise is the same on every run.
function noiseSource(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
  }
}

/** `seconds` of sound from a function of time (and the sample index). */
function render(seconds, at) {
  const n = Math.round(seconds * RATE)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = at(i / RATE, i)
  return out
}

/** Scale to a peak, and fade the last few milliseconds so a sound never ends on a step. */
function finish(samples, peak = 0.9, fadeMs = 6) {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const fade = Math.round((fadeMs / 1000) * RATE)
  return samples.map((s, i) => ((s / (max || 1)) * peak * Math.min(1, (samples.length - 1 - i) / fade)))
}

function write(name, samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const head = Buffer.alloc(44)
  head.write('RIFF', 0)
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVEfmt ', 8)
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20) // PCM
  head.writeUInt16LE(1, 22) // mono
  head.writeUInt32LE(RATE, 24)
  head.writeUInt32LE(RATE * 2, 28)
  head.writeUInt16LE(2, 32)
  head.writeUInt16LE(16, 34)
  head.write('data', 36)
  head.writeUInt32LE(data.length, 40)
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([head, data]))
  console.log(name, `${(samples.length / RATE).toFixed(2)} s`)
}

/** A click: partials that die in a few milliseconds, with a breath of noise on the front. */
function click(seconds, partials, decay, noiseAmount, seed) {
  const noise = noiseSource(seed)
  return render(seconds, (t) => {
    let s = 0
    for (const [hz, amount] of partials) s += amount * Math.sin(TAU * hz * t)
    return s * Math.exp(-t / decay) + noise() * noiseAmount * Math.exp(-t / 0.0015)
  })
}

/**
 * A hit, in three layers so it survives a phone's speaker (which plays almost nothing under 300 Hz): a low sine
 * falling from `from` to `to` hertz for those who can hear it, a knock three times higher that dies quickly, and a
 * snap of mid-band noise on the front. `decay` is how long the low layer rings.
 */
function hit(seconds, from, to, fall, decay, drive, seed) {
  const noise = noiseSource(seed)
  let low = 0
  let knock = 0
  let band = 0
  let dull = 0
  return render(seconds, (t) => {
    const fallen = Math.exp(-t / fall)
    low += (TAU * (to + (from - to) * fallen)) / RATE
    knock += (TAU * 3 * (to + (from - to) * fallen)) / RATE
    // Noise between about 700 Hz and 4 kHz: one low-pass minus a duller one.
    const n = noise()
    band += 0.42 * (n - band)
    dull += 0.09 * (n - dull)
    return (
      Math.tanh(drive * Math.exp(-t / decay) * Math.sin(low)) +
      0.55 * Math.exp(-t / (decay * 0.35)) * Math.sin(knock) +
      0.7 * (band - dull) * Math.exp(-t / 0.012)
    )
  })
}

fs.mkdirSync(OUT, { recursive: true })

// key: a letter of the address being typed.
write('key', finish(click(0.04, [[1800, 0.8], [3600, 0.2]], 0.004, 0.6, 3)))

// boom: the low hit, on the million and on the wordmark.
write('boom', finish(hit(0.75, 170, 44, 0.045, 0.16, 1.9, 7), 0.9, 30))

// riser: under the flood. Noise whose low-pass opens from 200 Hz to 8 kHz while it swells, over a sine climbing
// with it; it stops dead, because the picture cuts to black.
{
  const seconds = 3.06 // the flood's two bars
  const noise = noiseSource(9)
  let low = 0
  let phase = 0
  write(
    'riser',
    finish(
      render(seconds, (t) => {
        const x = t / seconds
        const cutoff = 200 * Math.pow(40, x)
        low += (1 - Math.exp((-TAU * cutoff) / RATE)) * (noise() - low)
        phase += (TAU * (90 + 310 * x * x)) / RATE
        return Math.pow(x, 2.2) * low * 1.6 + 0.3 * x * x * Math.sin(phase)
      }),
      0.9,
      4,
    ),
  )
}
