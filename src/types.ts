/**
 * Shared contracts between modules. Every module codes against these types.
 * Changing a type here is an integration decision — keep it backwards compatible.
 *
 * Time: all instants are epoch milliseconds (UTC) as `number` unless named *Iso.
 * Angles: degrees unless suffixed Rad. Distances: km unless suffixed M (metres).
 */

export interface LatLon {
  lat: number
  lon: number
}

/** A geocoded place the user is asking about. */
export interface Place extends LatLon {
  /** Primary label, e.g. "Waterloo" */
  label: string
  /** Secondary label, e.g. "Ontario, Canada" */
  sublabel?: string
  /** ISO 3166-1 alpha-2, lowercase, if known */
  countryCode?: string
  /** Where this place came from ('demo': an example chip; 'surprise': the "Surprise me" chip's random pick) */
  source: 'search' | 'geolocation' | 'url' | 'demo' | 'surprise' | 'pin'
  /** The label names a street, a building or an address (set by the geocoder): usage stats save its city instead */
  streetLevel?: boolean
  /**
   * What the place is, where the data says and it decides the name shown (imagery displayLabel): a first-level region
   * (a state, an oblast) is named as a region, never as its capital; a landmark or natural feature as one (a sea the
   * data files under a country keeps its name in the visitor's language). Unset: a town, a street, a spot.
   */
  kind?: 'region' | 'feature'
  /**
   * A curated place (an example chip, a Surprise me pick) shows its label in the visitor's language; this is its
   * English label, the one usage stats and record_lookup keep, so counts never split by language.
   */
  canonicalLabel?: string
}

/**
 * A message the UI renders in the visitor's language: `id` names a message in a catalog namespace (src/i18n/en/*),
 * `params` fill its slots. Engines and the controller emit these instead of English sentences, so a language switch
 * re-renders them and usage stats can log their English text (docs/I18N.md).
 */
export interface MessageRef {
  id: string
  params?: Record<string, string | number | boolean>
}

/**
 * Category drives every visual + copy decision. Keep this list short.
 *  - open-optical:     public-imagery optical satellites whose actual photos we can show (Sentinel-2, Landsat)
 *  - commercial-optical: high-res commercial imagers (Planet, Maxar, Airbus, BlackSky…) — "passed within view", never "photographed"
 *  - radar:            SAR satellites (Sentinel-1, ICEYE, Capella, Umbra) — see through cloud & night
 *  - weather-leo:      polar-orbiting weather/climate imagers (NOAA-20/21, Suomi NPP, Terra, Aqua, MetOp)
 *  - weather-geo:      geostationary weather imagers (GOES, Himawari, Meteosat, GK-2A…) — image you every ~10 min
 *  - crewed:           ISS, Tiangong
 *  - other:            everything else in the catalog (ambient only)
 */
export type SatCategory =
  | 'open-optical'
  | 'commercial-optical'
  | 'radar'
  | 'weather-leo'
  | 'weather-geo'
  | 'crewed'
  | 'other'

/**
 * Compact catalog row as written by scripts/fetch-catalog*.ts into public/data/catalog.json.
 * Order is fixed. Mean elements are TEME/SGP4 mean elements from the GP (OMM) data.
 * [norad, name, intlDes, epochIso, meanMotionRevPerDay, ecc, inclDeg, raanDeg, argpDeg, meanAnomalyDeg, bstar, ndot, nddot]
 */
export type CatalogRow = [
  number,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface CatalogFile {
  /** ISO time the catalog was fetched */
  fetchedAt: string
  /** e.g. "CelesTrak GP (GROUP=active)" or "SatNOGS DB (dev fallback)" */
  source: string
  count: number
  rows: CatalogRow[]
}

/** Curated knowledge about a satellite (or a family matched by name pattern). */
export interface SatProfile {
  /** Exact NORAD ids this profile applies to (preferred) */
  norad?: number[]
  /** Or a name regex source string, matched against catalog name (case-insensitive) */
  namePattern?: string
  displayName?: string
  operator: string
  category: SatCategory
  /** Full swath width at nadir, km (for pushbroom/fixed sensors) */
  swathKm?: number
  /** Max off-nadir pointing angle for agile/pointable imagers, degrees */
  maxOffNadirDeg?: number
  /** Best ground sample distance, metres */
  resolutionM?: number
  /** Only acquires in daylight (optical) */
  daylightOnly?: boolean
  /** If set, actual imagery is searchable via STAC */
  stac?: { collection: 'sentinel-2-l2a' | 'landsat-c2-l2'; platform: string }
  /** Its images are public and searched for at the place (Sentinel-1's radar): no image found means none published */
  openArchive?: boolean
  /** If set, actual imagery is available from NASA GIBS */
  gibs?: { collection: CaptureCollection; layer: string; kind: 'daily' | 'subdaily' }
  /** For geostationary: where its newest frame can be had (src/imagery/geoFrames.ts) */
  frames?: GeoFrameSource
  /** For geostationary: how its imager covers the disc, from which side and in how many minutes */
  scan?: { from: 'north' | 'south'; minutes: number }
  /** For geostationary: false if the satellite is in standby/storage (not imaging) */
  operational?: boolean
  /** One sentence, plain, precise. No hype. */
  blurb: string
  /** Geostationary: imaging cadence in minutes */
  cadenceMin?: number
}

/** A satellite resolved against profiles, ready to compute with. */
export interface SatInfo {
  norad: number
  name: string
  displayName: string
  category: SatCategory
  profile?: SatProfile
}

/** One overflight of the place by one satellite. */
export interface Pass {
  id: string
  norad: number
  /** Time of closest approach (minimum ground distance between sub-satellite point and place) */
  tClosest: number
  /** When the place entered / left the satellite's field of regard (or swath) */
  tStart: number
  tEnd: number
  /** Ground distance from sub-satellite point to place at closest approach, km */
  groundDistanceKm: number
  /** Off-nadir angle from the satellite to the place at closest approach, degrees */
  offNadirDeg: number
  /** Elevation of the satellite as seen from the place at closest approach, degrees */
  elevationDeg: number
  /** Azimuth from the place to the satellite at closest approach, degrees from north */
  azimuthDeg: number
  altitudeKm: number
  /** Ground speed of the sub-satellite point, km/s */
  groundSpeedKmS: number
  /** Heading of the ground track at closest approach, degrees from north (direction of motion) */
  headingDeg: number
  /** Ascending (moving north) or descending */
  node: 'ascending' | 'descending'
  /** Sun elevation at the place at tClosest, degrees */
  sunElevationDeg: number
  /** Place fell inside the fixed nadir swath (pushbroom instruments) */
  inSwath: boolean
  /** Place was within max off-nadir pointing (agile imagers) */
  inFieldOfRegard: boolean
  /**
   * Classification of what this pass means for the user:
   *  - 'imaged'   : a real captured image exists (matched to STAC)  → "photographed"
   *  - 'likely'   : geometry + daylight say a fixed-swath imager covered it, no image found (yet / cloud filter)
   *  - 'could'    : agile/commercial imager that could have pointed here → "passed within view"
   *  - 'overhead' : just passed over (crewed, other)
   */
  verdict: 'imaged' | 'likely' | 'could' | 'overhead'
  /** Sampled ground track around tClosest (±~8 min), for drawing */
  track: TrackPoint[]
  captureId?: string
  /**
   * Not an overflight: one full-disc scan by a geostationary imager, the one that took its newest public frame
   * (engine/geostationary.ts geoScanPass). The satellite stays put, so `track`, `headingDeg` and `groundSpeedKmS`
   * are the SCAN LINE's as it sweeps the disc, tStart / tEnd the scan's, and tClosest the moment the line crossed
   * the place. Never counted among the passes, nor its satellite among those that passed.
   */
  geostationary?: true
}

export interface TrackPoint {
  t: number
  lat: number
  lon: number
  altKm: number
}

/**
 * Imagery collections we can show real pixels from.
 *  - STAC (Planetary Computer / Earth Search): per-scene, 10–30 m
 *  - NASA GIBS: daily VIIRS/MODIS true-colour mosaics (250–375 m) and 10-min geostationary GeoColor (1–2 km)
 *  - Sentinel-1 radar (Planetary Computer `sentinel-1-rtc`): per-scene backscatter, shown at 20 m; not a photograph
 */
export type CaptureCollection =
  | 'sentinel-2-l2a'
  | 'landsat-c2-l2'
  | 'gibs-viirs-noaa20'
  | 'gibs-viirs-noaa21'
  | 'gibs-viirs-snpp'
  | 'gibs-modis-terra'
  | 'gibs-modis-aqua'
  | 'gibs-goes-east'
  | 'gibs-goes-west'
  | 'gibs-himawari'
  | 'eumetsat-meteosat-0deg'
  | 'eumetsat-meteosat-iodc'
  | 'sentinel-1-rtc'

/**
 * Where a geostationary watcher's newest frame comes from (src/imagery/geoFrames.ts: NASA GIBS or EUMETSAT). The
 * newest frame of each is also a capture of the report, with the scan that took it as its pass (engine/geostationary.ts).
 */
export type GeoFrameSource = 'goes-east' | 'goes-west' | 'himawari' | 'meteosat-0deg' | 'meteosat-iodc'

/** Classification of the pixel at the searched place in a capture ('cirrus' = thin cirrus, Sentinel-2 SCL class 10). */
export type SpotCloud = 'clear' | 'cirrus' | 'cloud' | 'shadow' | 'unknown'

/** A real image that exists in a public archive. */
export interface Capture {
  id: string
  provider: 'earth-search' | 'planetary-computer' | 'gibs' | 'eumetsat'
  collection: CaptureCollection
  /** STAC item id, or for GIBS: "<layer>@<ISO time or date>" */
  itemId: string
  /** e.g. "sentinel-2c", "landsat-9" */
  platform: string
  /** NORAD id resolved from platform */
  norad?: number
  datetime: number
  cloudCoverPct?: number
  gsdM: number
  sunElevationDeg?: number
  /** Footprint polygon of the full scene, [lon,lat][] outer ring */
  footprint?: [number, number][]
  /**
   * Square crop centred on the place, ready to <img src>; size in px is in the URL. Sentinel-2 / Landsat crops are cut
   * on the place's UTM grid (api/_lib/toneRender.ts placeGrid: whole native pixels, grid north up, the same grid for
   * every photo of the place); `geographic` asks for lon/lat instead (the globe's decals, which are mapped onto the
   * sphere in lon/lat).
   */
  cropUrl: (opts: { halfSizeKm: number; px: number; geographic?: boolean }) => string
  /** Full scene quicklook */
  previewUrl?: string
  /** Human link to the item in a browser (STAC browser / PC explorer) */
  sourceUrl?: string
  /** A geostationary frame: what it shows (day-and-night colour, visible light only, or thermal infrared) */
  band?: 'colour' | 'visible' | 'infrared'
  /** Classification at the searched place; filled by the engine for best-look candidates */
  spot?: SpotCloud
  /**
   * Share (0..1) of the photo's square that shows the ground, from the archive's own per-pixel classification
   * (cloud and cloud shadow 0, thin cirrus ½); filled with `spot`. Ranks the lead photo (results lib/photos.ts).
   */
  clearFraction?: number
}

/** Geostationary imagers that see the place continuously. */
export interface GeoWatcher {
  norad: number
  name: string
  operator: string
  subLon: number
  /** Elevation angle of the satellite from the place */
  elevationDeg: number
  cadenceMin: number
  /** Number of full-disk images that included the place in the report window */
  imagesInWindow: number
  /** Where this watcher's newest frame can be had, if a public service carries it (GOES, Himawari, Meteosat) */
  frames?: GeoFrameSource
  /** The place is at the rim of its disc, where a frame is part empty and smeared: shown small in its row, never as the lead picture */
  rim?: boolean
}

export interface Report {
  place: Place
  windowStart: number
  windowEnd: number
  generatedAt: number
  catalogFetchedAt: string
  passes: Pass[]
  captures: Capture[]
  geo: GeoWatcher[]
  /**
   * About degraded data (archive outages etc.), shown as bone-3 footnotes: messages (MessageRef), or plain English
   * sentences from reports made before notes were messages
   */
  notes?: (string | MessageRef)[]
  /** True while archive/GIBS verification is still streaming in */
  partial?: boolean
  /**
   * A final report only: NASA GIBS weather mosaics still being checked in the background (they answered after the
   * report's time budget). Each one that comes back with pixels patches the photo count upward in a later report;
   * the report that settles the last one has none. Absent or 0: the photo count is final.
   */
  lateChecks?: number
  /** True when the Sentinel-2/Landsat search failed or timed out on every provider (≠ "answered with nothing") */
  archiveFailed?: boolean
  /**
   * The latest CLEAR detailed capture (Sentinel-2/Landsat, not clouded at the spot) from up to ~60 days before the
   * window, used as the cover only when the window itself has no clear detailed photo. Shown honestly with its
   * date ("Last clear look · 24 Oct · 15 days ago"); it never counts toward the window's numbers.
   */
  clearCover?: Capture
  counts: {
    satellitesConsidered: number
    passes: number
    imaged: number
    likely: number
    could: number
    overhead: number
  }
}

/** Progress messages from long computations, shown in the HUD (mono, uppercase), in the visitor's language. */
export interface ProgressEvent {
  stage: 'catalog' | 'propagate' | 'archive' | 'match' | 'done'
  message: string | MessageRef
  /** 0..1 or undefined for indeterminate */
  fraction?: number
  /**
   * When it was said (performance.now()), on a line handed over after the fact: a link's search starts under the
   * loading screen (src/app/engineRun.ts), and the readout times its steps from these. Absent: said just now.
   */
  at?: number
}
