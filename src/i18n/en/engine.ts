/**
 * English copy the report engine emits (src/engine/report.ts, src/imagery/stac.ts): the computing readout's progress
 * lines and the report's footnotes about degraded data (an archive down, old orbital elements, a slow NASA GIBS).
 *
 * Why the engine never writes these sentences itself: a report is computed once and outlives a language switch (it
 * stays on screen, it is cached, a background check patches it), so it carries MessageRefs, `{ id, params }`, and the
 * results UI renders them in the language that is showing when it paints (src/i18n/messageRef.ts renderRef). An id is
 * 'engine.<group>.<key>' ('engine.note.archiveSlow' names `note.archiveSlow` below) and `params` are raw values (counts
 * as numbers), so each language formats and orders them itself. Every message with slots takes ONE object: the ref's
 * params, by name.
 *
 * Proper names stay as they are in every language: NASA, NASA GIBS (NASA's map-tile service), VIIRS, Sentinel-2,
 * Landsat, Earth Search and Planetary Computer (two public image archives).
 */
import { fmt } from '../../../api/_lib/i18n/format'
import { ns } from '../ns'

const en = fmt('en')
/** "16,912 OBJECTS", "1 PASS", "3 days": a grouped count and its noun */
const count = (n: number, one: string, other: string) => `${en.int(n)} ${en.plural(n, { one, other })}`

export default ns('engine', {
  /**
   * The computing readout (the screen between a search and its results): numbered rows that show what the engine is
   * doing. Mono, set in capitals by CSS (English happens to be written in capitals; a translation can use normal case),
   * in a narrow column beside the row's number, its duration and a status mark: about 40 characters fit a line on a
   * 390 px phone, and a longer row wraps to a second line, so keep these short. The whole readout is hidden from
   * screen readers (they hear a summary of their own). The ' · ' middle dot separates a phrase from its counter: what
   * follows the LAST middle dot, when it is short (20 characters or fewer: "· 288 / 403", "· 7 days"), is never broken
   * across lines, and the word before the dot moves down with it.
   */
  progress: {
    /** Row 1, while the orbit catalog (every tracked object's orbital elements) downloads */
    loadingCatalog: 'LOADING ORBITAL CATALOG',
    /** Row 1, done: how many objects (satellites and debris) the catalog has, about 17,000 */
    catalog: ({ objects }: { objects: number }) => `CATALOG · ${count(objects, 'OBJECT', 'OBJECTS')}`,
    /** Row 2, starting: orbits computed ahead for the search window (`days`, 7 in the app). About 400 orbits */
    propagateStart: ({ orbits, days }: { orbits: number; days: number }) =>
      `PROPAGATING ${count(orbits, 'ORBIT', 'ORBITS')} · ${count(days, 'DAY', 'DAYS')}`,
    /** Row 2, running: `done` of `total` satellites' orbits worked out (updates many times a second) */
    propagating: ({ done, total }: { done: number; total: number }) => `PROPAGATING ORBITS · ${en.int(done)} / ${en.int(total)}`,
    /** Row 3: the two public photo archives are being searched for this place's pictures (shown only while they are slow) */
    searchingArchives: 'SEARCHING SENTINEL-2 + LANDSAT ARCHIVES',
    /** Row 4: the archives' photos ("scenes") are paired with the computed overflights ("passes"). Two counts, any order */
    matching: ({ scenes, passes }: { scenes: number; passes: number }) =>
      `MATCHING ${count(scenes, 'SCENE', 'SCENES')} TO ${count(passes, 'PASS', 'PASSES')}`,
    /** Row 4, when NASA's daily weather-satellite pictures ("mosaics") are what the search still waits for */
    verifyingWeatherStart: 'VERIFYING NASA WEATHER MOSAICS',
    /** …and once it knows how many: `settled` of `total` checked */
    verifyingWeather: ({ settled, total }: { settled: number; total: number }) =>
      `VERIFYING NASA WEATHER MOSAICS · ${en.int(settled)} / ${en.int(total)}`,
    /** The report is complete: its passes and real images. Not shown on screen today (developer pages only) */
    done: ({ passes, images }: { passes: number; images: number }) =>
      `${count(passes, 'PASS', 'PASSES')} · ${count(images, 'IMAGE', 'IMAGES')}`,
  },

  /**
   * Footnotes under the results' summary, about data that is missing or less exact than usual. Small mono text in a
   * dim colour, numbered, each a sentence or two that wraps. Plain and specific: say what failed and what that means
   * for the numbers above. "Watched" and "likely" quote the results' verdict words (a pass that "counts as watched",
   * passes "shown as likely": the "Likely watched" verdict): use the same words the results use for those verdicts.
   * A "pass" is one satellite's overflight of the searched place; "orbital elements" are the published numbers an
   * orbit is computed from.
   */
  note: {
    /** The two photo archives took longer than 20 s, so no photos: every pass comes from orbit maths alone */
    archiveSlow: 'The Sentinel-2 and Landsat archives were too slow to answer; passes are shown from orbital geometry only.',
    /** …or they could not be reached at all */
    archiveDown: 'The Sentinel-2 and Landsat archives could not be reached; passes are shown from orbital geometry only.',
    /**
     * Planetary Computer's Sentinel-2 search failed and the Earth Search archive answered instead, with some scenes it
     * can only show whole (a small picture of the full scene), not cropped to the place
     */
    sentinel2Thumbnails: 'Sentinel-2 listed via Earth Search; some scenes show a full-scene thumbnail, not a crop.',
    /** …the same fallback, every scene still cropped */
    sentinel2EarthSearch: 'Sentinel-2 listed via Earth Search (Planetary Computer search unavailable).',
    /** One of the two archives did not answer (terse, like a log line: "archive unreachable; … may be missing") */
    sentinel2Down: 'Sentinel-2 archive unreachable; Sentinel-2 images may be missing.',
    landsatDown: 'Landsat archive unreachable; Landsat images may be missing.',
    /** The searched spot is open sea, which Sentinel-2 never photographs, so its overflights are not called likely */
    openOcean: "This spot is outside Sentinel-2's acquisition plan (open ocean).",
    /** The orbital elements were downloaded `days` days before the end of the searched week (always 3 or more) */
    elementsOld: ({ days }: { days: number }) =>
      `Orbital elements are ${count(days, 'day', 'days')} old, so pass times may be off by a few minutes.`,
    /** A past week (a shared link) computed from elements published after it */
    elementsNewer: 'These passes are reconstructed from newer orbital elements, so their times may be off by a few minutes.',
    /**
     * VIIRS weather pictures NASA GIBS had not confirmed in time but that count anyway, because VIIRS photographs the
     * whole Earth every day. Note "VIIRS images the whole globe": "images" is a verb (photographs). The sentence shrinks
     * and then disappears as late confirmations arrive, so `n` counts down to 1
     */
    gibsUnconfirmed: ({ n }: { n: number }) =>
      en.plural(n, {
        one: 'NASA GIBS was slow to confirm one VIIRS image; VIIRS images the whole globe every day, so that pass counts as watched.',
        other: `NASA GIBS was slow to confirm ${en.int(n)} VIIRS images; VIIRS images the whole globe every day, so those passes count as watched.`,
      }),
    /** NASA GIBS did not answer in time and none of the week's weather-satellite pictures could be checked */
    gibsSlowAll: 'NASA GIBS did not answer in time, so weather-satellite images are not shown.',
    /** …some of them (`missing` of `total`; `missing` can be 1): those passes keep the "Likely watched" verdict */
    gibsSlowSome: ({ missing, total }: { missing: number; total: number }) =>
      `NASA GIBS did not return ${en.int(missing)} of ${en.int(total)} weather-satellite images in time; those passes are shown as likely.`,
    /** NASA GIBS could not be reached at all */
    gibsDownAll: 'NASA GIBS could not be reached, so weather-satellite images are not shown.',
    /** …or failed for some of the pictures (`missing` of `total`; `missing` can be 1) */
    gibsDownSome: ({ missing, total }: { missing: number; total: number }) =>
      `NASA GIBS failed to return ${en.int(missing)} of ${en.int(total)} weather-satellite images; those passes are shown as likely.`,
  },
})
