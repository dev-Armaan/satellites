/**
 * Render share cards locally, without a server: import the /api/og handler, call it with
 * Request objects and write the cards, each named by its response's content-type (R3-15: /api/og
 * answers JPEG since R2SH4, so the files are og-*.jpg; anything else keeps its own extension).
 *
 *   npx tsx scripts/backend-render-og.ts                    # all cases → scratch/backend/og-*.jpg
 *   npx tsx scripts/backend-render-og.ts --out <dir>        # … into <dir> instead
 *   npx tsx scripts/backend-render-og.ts --default          # also bake public/og-default.png from satori's
 *                                                            lossless PNG (not the served JPEG; no host in the
 *                                                            footer unless SITE_URL is set), palette-quantised
 *                                                            with Pillow when available (~240 KB instead of
 *                                                            ~820 KB: WhatsApp drops previews over ~300 KB)
 *   npx tsx scripts/backend-render-og.ts --default --default-dest <file.png>   # bake somewhere else (a dry run)
 *   npx tsx scripts/backend-render-og.ts --id <shareId>     # a stored share (needs .env.local)
 *   SITE_URL=https://example.org npx tsx …                  # print that host in the card footer
 *
 * The cases use real archive item ids and real SGP4 pass geometry for Waterloo, Ontario (from the
 * ui-results sandbox fixture). They are dev fixtures for this script only.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { displayHost } from '../api/_lib/env.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_OUT = path.join(ROOT, 'scratch', 'backend')

/** File extension for a response's content-type ("image/jpeg; …" → "jpg"). */
export function extFor(contentType: string | null): string {
  const t = (contentType ?? '').split(';')[0].trim().toLowerCase()
  const known: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'text/html': 'html', 'text/plain': 'txt' }
  return known[t] ?? (t.startsWith('image/') ? t.slice(6).replace(/[^a-z0-9]/g, '') || 'img' : 'bin')
}

/** The PNG signature: the bake must write a real PNG under the .png name. */
const isPng = (b: Uint8Array) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47

/** Load .env.local into process.env (the functions read it at request time). */
async function loadEnv(): Promise<void> {
  try {
    const txt = await readFile(path.join(ROOT, '.env.local'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    /* no env: id cases will fall back to the default card */
  }
}

const WATERLOO = { place: 'Waterloo', lat: '43.4723', lon: '-80.5449', sv: '256' }
const S2C_IMAGED = {
  ...WATERLOO,
  sat: 'Sentinel-2C', norad: '60989', verdict: 'imaged', t: '1793549661025', alt: '794.9', off: '5.26', cloud: '25.46',
  dist: '73.26', az: '103.9', hdg: '194.6', collection: 'sentinel-2-l2a', item: 'S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803',
}

const CASES: Record<string, Record<string, string>> = {
  'default': {},
  's2c-imaged': S2C_IMAGED,
  // In the sharer's language (`l`), with the place named in it: the Cyrillic faces, and Han in Japanese forms.
  'uk-imaged': { ...S2C_IMAGED, place: 'Ватерлоо', l: 'uk' },
  'ja-imaged': { ...S2C_IMAGED, place: 'オンタリオ州ウォータールー', l: 'ja' },
  'landsat9-imaged': {
    ...WATERLOO,
    sat: 'Landsat 9', norad: '49260', verdict: 'imaged', t: '1793462633109', alt: '708.3', off: '3.39', cloud: '11.68',
    dist: '41.97', az: '103.6', hdg: '194.1', collection: 'landsat-c2-l2', item: 'LC09_L2SP_018030_20261031_02_T1',
  },
  'aqua-modis-imaged': {
    ...WATERLOO,
    sat: 'Aqua', norad: '27424', verdict: 'imaged', t: '1793649253606', alt: '692.7', off: '48.38', dist: '845.15', az: '68.1',
    hdg: '345.3', collection: 'gibs-modis-aqua', item: 'MODIS_Aqua_CorrectedReflectance_TrueColor@2026-11-02',
  },
  's2b-clouded': {
    ...WATERLOO,
    sat: 'Sentinel-2B', norad: '42063', verdict: 'imaged', t: '1793377877966', alt: '794.7', off: '8.94', cloud: '80.8',
    dist: '125.23', az: '285.6', hdg: '194.7', collection: 'sentinel-2-l2a', item: 'S2B_MSIL2A_20261030T162419_R040_T17TNJ_20261030T200303',
  },
  'place': { kind: 'place', place: 'Waterloo', lat: '43.47', lon: '-80.54' },
  'skysat-could': {
    ...WATERLOO,
    sat: 'SkySat-C3', norad: '41774', verdict: 'could', t: '1793625435556', alt: '397.1', off: '16.99', dist: '121.71', az: '283.1', hdg: '192.1',
  },
  'iss-overhead': {
    ...WATERLOO,
    sat: 'ISS (Zarya)', norad: '25544', verdict: 'overhead', t: '1793527773425', alt: '427.5', off: '0.87', dist: '6.47', az: '33.9', hdg: '122.9',
    el: '86.2', spd: '7.36',
  },
  'metop-likely': {
    ...WATERLOO,
    sat: 'MetOp-B', norad: '38771', verdict: 'likely', t: '1793197950702', alt: '827.5', off: '20.96', dist: '320.3', az: '102', hdg: '194.6',
  },
  'long-place': {
    place: 'Saint-Jean-sur-Richelieu, Montérégie', lat: '45.3', lon: '-73.26',
    sat: 'Sentinel-2C', norad: '60989', verdict: 'could', t: '1793549661025', alt: '794.9', off: '5.26', dist: '18', az: '280', hdg: '194.6',
  },
  // A week's summary (SH6, R3-13): "256 satellites watched Waterloo this week." / "31 photos were made public."
  'summary': {
    kind: 'summary', q: '43.47,-80.54', n: 'Waterloo', sv: '256', sc: '31,220,1544,66', sw: '1793678400000',
    bc: 'sentinel-2-l2a', bi: 'S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803', bs: 'Sentinel-2C', bt: '1793549661025', bg: '10',
  },
  'summary-one': { kind: 'summary', q: '43.47,-80.54', n: 'Waterloo', sv: '1', sc: '1,0,0,0', sw: '1793678400000' },
  'summary-long-place': {
    // A long label over Waterloo's own Landsat scene (the item must cover the point), still partial.
    kind: 'summary', q: '43.47,-80.54', n: 'Saint-Jean-sur-Richelieu, Montérégie', sv: '1234', sc: '5678,220,12544,66', sw: '1793678400000', sp: '1',
    bc: 'landsat-c2-l2', bi: 'LC09_L2SP_018030_20261031_02_T1', bs: 'Landsat 9', bt: '1793462633109', bg: '30',
  },
  'summary-outage': { kind: 'summary', q: '43.47,-80.54', n: 'Waterloo', sv: '256', sc: '0,220,1544,66', sw: '1793678400000', sa: '1' },
  'summary-none': { kind: 'summary', q: '43.47,-80.54', n: 'Waterloo', sv: '0', sc: '0,0,0,0', sw: '1793678400000' },
  'bad-item': {
    ...WATERLOO,
    sat: 'Sentinel-2C', norad: '60989', verdict: 'imaged', t: '1793549661025', alt: '794.9', off: '5.26', cloud: '25',
    dist: '73', az: '103.9', hdg: '194.6', collection: 'sentinel-2-l2a', item: 'S2C_MSIL2A_20990101T000000_R140_T17TNJ_20990101T000000',
  },
}

async function main() {
  await loadEnv()
  // Imported through a variable: tsconfig.node.json has no `jsx` setting, and TypeScript refuses to
  // resolve a static import of a .tsx module without one (even though og.tsx contains no JSX).
  const ogModule = '../api/og.tsx'
  const { handleOg, defaultCardPng } = (await import(ogModule)) as {
    handleOg: (request: Request) => Promise<Response>
    defaultCardPng: (host: string) => Promise<Uint8Array>
  }
  const args = process.argv.slice(2)
  const arg = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  const out = path.resolve(ROOT, arg('--out') ?? DEFAULT_OUT)
  await mkdir(out, { recursive: true })
  const id = arg('--id')
  const jobs: [string, string][] = id !== undefined ? [[`id-${id}`, `id=${encodeURIComponent(id)}`]] : Object.entries(CASES).map(([k, q]) => [k, new URLSearchParams(q).toString()])

  const origin = process.env.SITE_URL || 'http://localhost:5186'
  for (const [name, qs] of jobs) {
    const t0 = performance.now()
    // SITE_URL (if set) is what the card footer prints; otherwise a local origin, which the card hides.
    const res = await handleOg(new Request(`${origin}/api/og${qs ? `?${qs}` : ''}`))
    const buf = Buffer.from(await res.arrayBuffer())
    const type = res.headers.get('content-type')
    const file = path.join(out, `og-${name}.${extFor(type)}`)
    await writeFile(file, buf)
    console.log(
      `${name.padEnd(20)} ${res.status} ${type} ${(buf.byteLength / 1024).toFixed(0).padStart(5)} KB ` +
        `${(performance.now() - t0).toFixed(0).padStart(6)} ms  cache: ${res.headers.get('cache-control')}  → ${path.relative(ROOT, file)}`,
    )
  }

  if (args.includes('--default')) {
    // The root card is a static PNG (index.html points at it). Bake it from satori's lossless PNG, never from
    // the JPEG /api/og serves, so the file is a real PNG with no JPEG artefacts under the palette.
    const dest = path.resolve(ROOT, arg('--default-dest') ?? path.join('public', 'og-default.png'))
    // The footer host exactly as /api/og prints it (hidden for a local origin).
    const host = displayHost(origin)
    const png = await defaultCardPng(host)
    if (!isPng(png)) throw new Error('defaultCardPng did not return a PNG')
    await writeFile(dest, png)
    try {
      // Median-cut to 256 colours with dithering: visually identical at card size, a third of the bytes.
      const py = 'import sys; from PIL import Image; im=Image.open(sys.argv[1]).convert("RGB"); im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(sys.argv[1], format="PNG", optimize=True)'
      execFileSync('python3', ['-c', py, dest], { stdio: 'pipe' })
    } catch {
      console.log('  (Pillow unavailable: the default card stays a full-colour PNG)')
    }
    const baked = new Uint8Array(await readFile(dest))
    if (!isPng(baked)) throw new Error(`${dest} is not a PNG`)
    console.log(`  → ${path.relative(ROOT, dest)}  image/png  ${((await stat(dest)).size / 1024).toFixed(0)} KB`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
