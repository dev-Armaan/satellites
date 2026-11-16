/**
 * Curated knowledge about the satellites that matter to Overflight.
 *
 * Rules for this table:
 *  - Factual and conservative. If a figure is not published, leave it out (the UI shows "—").
 *  - NORAD ids are preferred; name patterns are used for constellations and are anchored so they
 *    never catch unrelated objects (e.g. "JILIN-1 GAOFEN" must not match the GAOFEN profiles).
 *  - Geostationary longitudes are never stored here: they always come from propagation.
 *  - `scan` is how a geostationary imager covers the disc: ABI and AHI step their east-west swaths from north to
 *    south, SEVIRI and FCI from south to north; a full disc takes about 10 minutes (SEVIRI 12.5). It times the scan
 *    line's crossing of a place within a frame, to about a minute.
 *  - Blurbs are one plain sentence (docs/DESIGN.md §7). No hype.
 *
 * Resolution order: an exact NORAD id wins; otherwise the FIRST matching name pattern in table order.
 * Every catalog object that matches nothing is category 'other' (ambient only).
 */
import type { SatProfile } from '@/types'

const MAXAR = 'Maxar Intelligence'
const PLANET = 'Planet'
const AIRBUS = 'Airbus'

export const PROFILES: readonly SatProfile[] = [
  // ───────────────────────────── open optical: real pixels via STAC ─────────────────────────────
  {
    norad: [40697],
    displayName: 'Sentinel-2A',
    operator: 'ESA / Copernicus',
    category: 'open-optical',
    swathKm: 290,
    resolutionM: 10,
    daylightOnly: true,
    stac: { collection: 'sentinel-2-l2a', platform: 'sentinel-2a' },
    blurb: 'Copernicus multispectral imager: 13 bands, 10 m pixels, a 290 km swath.',
  },
  {
    norad: [42063],
    displayName: 'Sentinel-2B',
    operator: 'ESA / Copernicus',
    category: 'open-optical',
    swathKm: 290,
    resolutionM: 10,
    daylightOnly: true,
    stac: { collection: 'sentinel-2-l2a', platform: 'sentinel-2b' },
    blurb: 'Copernicus multispectral imager: 13 bands, 10 m pixels, a 290 km swath.',
  },
  {
    norad: [60989],
    displayName: 'Sentinel-2C',
    operator: 'ESA / Copernicus',
    category: 'open-optical',
    swathKm: 290,
    resolutionM: 10,
    daylightOnly: true,
    stac: { collection: 'sentinel-2-l2a', platform: 'sentinel-2c' },
    blurb: 'Copernicus multispectral imager: 13 bands, 10 m pixels, a 290 km swath.',
  },
  {
    norad: [39084],
    displayName: 'Landsat 8',
    operator: 'USGS / NASA',
    category: 'open-optical',
    swathKm: 185,
    resolutionM: 30,
    daylightOnly: true,
    stac: { collection: 'landsat-c2-l2', platform: 'landsat-8' },
    blurb: 'Operational Land Imager: 30 m colour and 15 m panchromatic pixels across a 185 km swath.',
  },
  {
    norad: [49260],
    displayName: 'Landsat 9',
    operator: 'USGS / NASA',
    category: 'open-optical',
    swathKm: 185,
    resolutionM: 30,
    daylightOnly: true,
    stac: { collection: 'landsat-c2-l2', platform: 'landsat-9' },
    blurb: 'Operational Land Imager 2: 30 m colour and 15 m panchromatic pixels across a 185 km swath.',
  },

  // ───────────────────────────── weather, polar orbit ─────────────────────────────
  {
    norad: [43013],
    displayName: 'NOAA-20',
    operator: 'NOAA',
    category: 'weather-leo',
    swathKm: 3040,
    resolutionM: 375,
    gibs: { collection: 'gibs-viirs-noaa20', layer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', kind: 'daily' },
    blurb: 'Its VIIRS imager sweeps a 3,040 km swath, covering the whole planet twice a day.',
  },
  {
    norad: [54234],
    displayName: 'NOAA-21',
    operator: 'NOAA',
    category: 'weather-leo',
    swathKm: 3040,
    resolutionM: 375,
    gibs: { collection: 'gibs-viirs-noaa21', layer: 'VIIRS_NOAA21_CorrectedReflectance_TrueColor', kind: 'daily' },
    blurb: 'Its VIIRS imager sweeps a 3,040 km swath, covering the whole planet twice a day.',
  },
  {
    norad: [37849],
    displayName: 'Suomi NPP',
    operator: 'NASA / NOAA',
    category: 'weather-leo',
    swathKm: 3040,
    resolutionM: 375,
    gibs: { collection: 'gibs-viirs-snpp', layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', kind: 'daily' },
    blurb: 'The first VIIRS imager in orbit, sweeping a 3,040 km swath since 2011.',
  },
  {
    norad: [25994],
    displayName: 'Terra',
    operator: 'NASA',
    category: 'weather-leo',
    swathKm: 2330,
    resolutionM: 250,
    gibs: { collection: 'gibs-modis-terra', layer: 'MODIS_Terra_CorrectedReflectance_TrueColor', kind: 'daily' },
    blurb: 'Its MODIS imager has watched the whole planet, 2,330 km at a time, since 1999.',
  },
  {
    norad: [27424],
    displayName: 'Aqua',
    operator: 'NASA',
    category: 'weather-leo',
    swathKm: 2330,
    resolutionM: 250,
    gibs: { collection: 'gibs-modis-aqua', layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor', kind: 'daily' },
    blurb: 'Its MODIS imager has watched the whole planet, 2,330 km at a time, since 2002.',
  },
  {
    norad: [38771],
    displayName: 'MetOp-B',
    operator: 'EUMETSAT',
    category: 'weather-leo',
    swathKm: 2900,
    resolutionM: 1100,
    blurb: 'European polar weather satellite; its AVHRR imager covers a 2,900 km swath at 1.1 km.',
  },
  {
    norad: [43689],
    displayName: 'MetOp-C',
    operator: 'EUMETSAT',
    category: 'weather-leo',
    swathKm: 2900,
    resolutionM: 1100,
    blurb: 'European polar weather satellite; its AVHRR imager covers a 2,900 km swath at 1.1 km.',
  },
  {
    norad: [41335],
    displayName: 'Sentinel-3A',
    operator: 'ESA / EUMETSAT',
    category: 'weather-leo',
    swathKm: 1270,
    resolutionM: 300,
    blurb: 'Its OLCI instrument images land and ocean colour in 21 bands across a 1,270 km swath.',
  },
  {
    norad: [43437],
    displayName: 'Sentinel-3B',
    operator: 'ESA / EUMETSAT',
    category: 'weather-leo',
    swathKm: 1270,
    resolutionM: 300,
    blurb: 'Its OLCI instrument images land and ocean colour in 21 bands across a 1,270 km swath.',
  },
  {
    namePattern: '^FENGYUN 3[DFH]$',
    operator: 'CMA',
    category: 'weather-leo',
    swathKm: 2900,
    resolutionM: 250,
    blurb: 'Chinese polar weather satellite; its MERSI imager covers a 2,900 km swath.',
  },
  {
    namePattern: '^FENGYUN 3E$',
    operator: 'CMA',
    category: 'weather-leo',
    swathKm: 2900,
    blurb: 'Chinese dawn–dusk orbit weather satellite with a low-light MERSI imager.',
  },

  // ───────────────────────────── weather, geostationary ─────────────────────────────
  {
    norad: [60133],
    displayName: 'GOES-19',
    operator: 'NOAA',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 10,
    gibs: { collection: 'gibs-goes-east', layer: 'GOES-East_ABI_GeoColor', kind: 'subdaily' },
    frames: 'goes-east',
    scan: { from: 'north', minutes: 10 },
    blurb: 'GOES-East: images the full disk of the Americas every 10 minutes.',
  },
  {
    norad: [51850],
    displayName: 'GOES-18',
    operator: 'NOAA',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 10,
    gibs: { collection: 'gibs-goes-west', layer: 'GOES-West_ABI_GeoColor', kind: 'subdaily' },
    frames: 'goes-west',
    scan: { from: 'north', minutes: 10 },
    blurb: 'GOES-West: images the full disk of the Pacific and the Americas every 10 minutes.',
  },
  {
    norad: [41866],
    displayName: 'GOES-16',
    operator: 'NOAA',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 10,
    blurb: 'The former GOES-East, kept in orbit as a standby spare.',
  },
  {
    norad: [43226],
    displayName: 'GOES-17',
    operator: 'NOAA',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 10,
    blurb: 'The former GOES-West, kept in orbit as a standby spare.',
  },
  {
    norad: [41836],
    displayName: 'Himawari-9',
    operator: 'JMA',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 10,
    gibs: { collection: 'gibs-himawari', layer: 'Himawari_AHI_Band3_Red_Visible_1km', kind: 'subdaily' },
    frames: 'himawari',
    scan: { from: 'north', minutes: 10 },
    blurb: 'Japan’s weather satellite: images the full disk of Asia and the Pacific every 10 minutes.',
  },
  {
    norad: [40267],
    displayName: 'Himawari-8',
    operator: 'JMA',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 10,
    blurb: 'Backup to Himawari-9.',
  },
  {
    norad: [54743],
    displayName: 'Meteosat-12',
    operator: 'EUMETSAT',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 10,
    frames: 'meteosat-0deg',
    scan: { from: 'south', minutes: 10 },
    blurb: 'The first third-generation Meteosat (MTG-I1): images Europe and Africa every 10 minutes.',
  },
  {
    norad: [28912],
    displayName: 'Meteosat-9',
    operator: 'EUMETSAT',
    category: 'weather-geo',
    resolutionM: 1000,
    operational: true,
    cadenceMin: 15,
    frames: 'meteosat-iodc',
    scan: { from: 'south', minutes: 12.5 },
    blurb: 'Covers the Indian Ocean region, imaging the full disk every 15 minutes.',
  },
  {
    norad: [38552],
    displayName: 'Meteosat-10',
    operator: 'EUMETSAT',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 15,
    blurb: 'Second-generation Meteosat; not counted here as a full-disk imager of this place.',
  },
  {
    norad: [40732],
    displayName: 'Meteosat-11',
    operator: 'EUMETSAT',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 15,
    blurb: 'Second-generation Meteosat; not counted here as a full-disk imager of this place.',
  },
  {
    norad: [100530],
    displayName: 'MTG-I2',
    operator: 'EUMETSAT',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 10,
    blurb: 'Second third-generation Meteosat imager; not yet the operational service.',
  },
  {
    norad: [43823],
    displayName: 'GEO-KOMPSAT-2A',
    operator: 'KMA',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 10,
    blurb: 'Korea’s weather satellite: images the full disk every 10 minutes.',
  },
  {
    norad: [48808],
    displayName: 'Fengyun-4B',
    operator: 'CMA',
    category: 'weather-geo',
    resolutionM: 500,
    operational: true,
    cadenceMin: 15,
    blurb: 'China’s operational geostationary weather satellite: images the full disk every 15 minutes.',
  },
  {
    norad: [41882],
    displayName: 'Fengyun-4A',
    operator: 'CMA',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 15,
    blurb: 'Older Chinese geostationary imager, not counted as the primary service.',
  },
  {
    norad: [67246],
    displayName: 'Fengyun-4C',
    operator: 'CMA',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 15,
    blurb: 'Newest Chinese geostationary imager; not yet the operational service.',
  },
  {
    norad: [41752],
    displayName: 'INSAT-3DR',
    operator: 'ISRO',
    category: 'weather-geo',
    resolutionM: 1000,
    operational: true,
    cadenceMin: 30,
    blurb: 'Indian weather satellite: images the full disk every 30 minutes.',
  },
  {
    norad: [58990],
    displayName: 'INSAT-3DS',
    operator: 'ISRO',
    category: 'weather-geo',
    resolutionM: 1000,
    operational: true,
    cadenceMin: 30,
    blurb: 'Indian weather satellite: images the full disk every 30 minutes.',
  },
  {
    norad: [39216],
    displayName: 'INSAT-3D',
    operator: 'ISRO',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 30,
    blurb: 'Older Indian weather satellite, not counted as an operational imager.',
  },
  {
    norad: [44903],
    displayName: 'Elektro-L 3',
    operator: 'Roscosmos',
    category: 'weather-geo',
    resolutionM: 1000,
    operational: true,
    cadenceMin: 30,
    blurb: 'Russian geostationary weather satellite: images the full disk every 30 minutes.',
  },
  {
    norad: [55506],
    displayName: 'Elektro-L 4',
    operator: 'Roscosmos',
    category: 'weather-geo',
    resolutionM: 1000,
    operational: true,
    cadenceMin: 30,
    blurb: 'Russian geostationary weather satellite: images the full disk every 30 minutes.',
  },
  {
    norad: [41105],
    displayName: 'Elektro-L 2',
    operator: 'Roscosmos',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 30,
    blurb: 'Older Russian geostationary weather satellite, not counted as an operational imager.',
  },
  {
    norad: [67756],
    displayName: 'Elektro-L 5',
    operator: 'Roscosmos',
    category: 'weather-geo',
    operational: false,
    cadenceMin: 30,
    blurb: 'Newest Russian geostationary weather satellite; not yet counted as operational.',
  },

  // ───────────────────────────── commercial and government high-resolution optical ─────────────────────────────
  {
    norad: [32060],
    displayName: 'WorldView-1',
    operator: MAXAR,
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 40,
    daylightOnly: true,
    blurb: 'Panchromatic imager with 50 cm pixels that can point well off its ground track.',
  },
  {
    norad: [35946],
    displayName: 'WorldView-2',
    operator: MAXAR,
    category: 'commercial-optical',
    resolutionM: 0.46,
    maxOffNadirDeg: 40,
    daylightOnly: true,
    blurb: 'Eight-band imager with 46 cm panchromatic pixels.',
  },
  {
    norad: [40115],
    displayName: 'WorldView-3',
    operator: MAXAR,
    category: 'commercial-optical',
    resolutionM: 0.31,
    maxOffNadirDeg: 40,
    daylightOnly: true,
    blurb: 'Imager with 31 cm panchromatic pixels and 16 spectral bands.',
  },
  {
    norad: [33331],
    displayName: 'GeoEye-1',
    operator: MAXAR,
    category: 'commercial-optical',
    resolutionM: 0.41,
    maxOffNadirDeg: 40,
    daylightOnly: true,
    blurb: 'Imager with 41 cm panchromatic pixels, in orbit since 2008.',
  },
  {
    norad: [59625, 59626, 60452, 60453, 62900, 62901],
    namePattern: '^LEGION \\d+$',
    operator: MAXAR,
    category: 'commercial-optical',
    resolutionM: 0.3,
    maxOffNadirDeg: 40,
    daylightOnly: true,
    blurb: 'One of Maxar’s WorldView Legion imagers, with roughly 30 cm pixels.',
  },
  {
    namePattern: '^SKYSAT-',
    operator: PLANET,
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Agile Planet imager with roughly 50 cm pixels; it is tasked to point at specific targets.',
  },
  {
    namePattern: '^PELICAN-',
    operator: PLANET,
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 45,
    daylightOnly: true,
    blurb: 'Planet’s newer agile high-resolution imager.',
  },
  {
    namePattern: '^FLOCK ',
    operator: PLANET,
    category: 'commercial-optical',
    resolutionM: 3,
    swathKm: 32,
    daylightOnly: true,
    blurb: 'A Planet SuperDove cubesat; the fleet images most of Earth’s land every day at about 3 m.',
  },
  {
    namePattern: '^GLOBAL-\\d+$',
    operator: 'BlackSky',
    category: 'commercial-optical',
    resolutionM: 1,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'A BlackSky rapid-revisit imager with roughly 1 m pixels or better.',
  },
  {
    norad: [38012],
    displayName: 'Pléiades 1A',
    operator: AIRBUS,
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Agile imager delivering 50 cm panchromatic products.',
  },
  {
    norad: [39019],
    displayName: 'Pléiades 1B',
    operator: AIRBUS,
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Agile imager delivering 50 cm panchromatic products.',
  },
  {
    norad: [48268, 49070],
    namePattern: '^PLEIADES NEO \\d+$',
    operator: AIRBUS,
    category: 'commercial-optical',
    resolutionM: 0.3,
    maxOffNadirDeg: 45,
    daylightOnly: true,
    blurb: 'Agile imager with 30 cm native pixels.',
  },
  {
    norad: [38755],
    displayName: 'SPOT 6',
    operator: AIRBUS,
    category: 'commercial-optical',
    resolutionM: 1.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Wide-area imager with 1.5 m panchromatic pixels and a 60 km swath.',
  },
  {
    norad: [40053],
    displayName: 'SPOT 7',
    operator: 'Azercosmos',
    category: 'commercial-optical',
    resolutionM: 1.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Twin of SPOT 6, operated by Azerbaijan as Azersky.',
  },
  {
    norad: [38338],
    displayName: 'KOMPSAT-3',
    operator: 'KARI',
    category: 'commercial-optical',
    resolutionM: 0.7,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Korean imager with 70 cm panchromatic pixels.',
  },
  {
    norad: [40536],
    displayName: 'KOMPSAT-3A',
    operator: 'KARI',
    category: 'commercial-optical',
    resolutionM: 0.55,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Korean imager with 55 cm panchromatic pixels and an infrared channel.',
  },
  {
    namePattern: '^JILIN',
    operator: 'Chang Guang Satellite',
    category: 'commercial-optical',
    resolutionM: 0.75,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Part of China’s Jilin-1 commercial constellation, with sub-metre imagers.',
  },
  {
    namePattern: '^SUPERVIEW(-1 |\\sNEO-1 |\\sNEO-3 )',
    operator: 'Siwei',
    category: 'commercial-optical',
    resolutionM: 0.5,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Chinese commercial imager with roughly 50 cm pixels or better.',
  },
  {
    namePattern: '^GAOFEN-1( 0[2-4])?$',
    operator: 'CNSA',
    category: 'commercial-optical',
    resolutionM: 2,
    swathKm: 60,
    daylightOnly: true,
    blurb: 'Chinese government imager with 2 m panchromatic and 16 m wide-field cameras.',
  },
  {
    namePattern: '^GAOFEN-6$',
    operator: 'CNSA',
    category: 'commercial-optical',
    resolutionM: 2,
    swathKm: 90,
    daylightOnly: true,
    blurb: 'Chinese government imager with 2 m panchromatic and 16 m wide-field cameras.',
  },
  {
    namePattern: '^GAOFEN-2$',
    operator: 'CNSA',
    category: 'commercial-optical',
    resolutionM: 0.8,
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Chinese government imager with 80 cm panchromatic pixels.',
  },
  {
    namePattern: '^GAOFEN-7$',
    operator: 'CNSA',
    category: 'commercial-optical',
    resolutionM: 0.65,
    swathKm: 20,
    daylightOnly: true,
    blurb: 'Chinese government stereo-mapping imager with sub-metre pixels.',
  },
  {
    namePattern: '^GAOFEN-(9|11|14) 0\\d$',
    operator: 'CNSA',
    category: 'commercial-optical',
    maxOffNadirDeg: 30,
    daylightOnly: true,
    blurb: 'Chinese government high-resolution optical satellite; its specifications are not published.',
  },

  // ───────────────────────────── radar (SAR): sees through cloud and at night ─────────────────────────────
  // minOffNadirDeg is the strip under the track that a side-looking radar cannot image (src/engine/passes.ts): the
  // operator's smallest published angle in any mode, extended ranges included. An incidence angle is converted to
  // off-nadir at the family's highest altitude in the catalog and rounded down, so no pass it could image is dropped.
  {
    norad: [39634, 62261, 66315],
    namePattern: '^SENTINEL-1[A-Z]$',
    operator: 'ESA / Copernicus',
    category: 'radar',
    swathKm: 250,
    // Its IW images as published (GRD: 20 × 22 m); the 5 m is single-look range only, never shown here.
    resolutionM: 20,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 16.3, // 18.3° incidence (beam S1; IW starts at 29.1°), ESA SentiWiki
    blurb: 'Copernicus C-band radar that publishes every image: a 250 km swath to one side at 20 m, through cloud, day or night.',
    openArchive: true,
  },
  {
    namePattern: '^ICEYE-',
    operator: 'ICEYE',
    category: 'radar',
    resolutionM: 0.5,
    maxOffNadirDeg: 35,
    minOffNadirDeg: 4.5, // 5° incidence, ICEYE's 'time dominant' range (best from 15–20°), product spec 6.0.7
    blurb: 'Small X-band radar satellite that can be tasked to image through cloud, day or night.',
  },
  {
    namePattern: '^CAPELLA-',
    operator: 'Capella Space',
    category: 'radar',
    resolutionM: 0.5,
    maxOffNadirDeg: 45,
    minOffNadirDeg: 5, // 5° look angle, its full accessible range (standard from 15°), Capella support
    blurb: 'X-band radar satellite with roughly 50 cm spotlight imagery, day or night.',
  },
  {
    namePattern: '^UMBRA-',
    operator: 'Umbra',
    category: 'radar',
    resolutionM: 0.25,
    maxOffNadirDeg: 45,
    minOffNadirDeg: 9.1, // 10° incidence (80° grazing, 1 m spotlight), Umbra Canopy docs
    blurb: 'X-band radar satellite with spotlight imagery down to about 25 cm.',
  },
  {
    namePattern: '^STRIX-',
    operator: 'Synspective',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 15, // 15° off nadir, Synspective SAR data product guide
    blurb: 'Japanese small X-band radar satellite.',
  },
  {
    namePattern: '^QPS-SAR-',
    operator: 'iQPS',
    category: 'radar',
    resolutionM: 0.5,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 15, // 15° off nadir, iQPS
    blurb: 'Japanese small X-band radar satellite.',
  },
  {
    norad: [39227],
    displayName: 'KOMPSAT-5',
    operator: 'KARI',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 18.2, // 20° incidence, KARI / SIIS product spec
    blurb: 'Korean X-band radar satellite with 1 m spotlight imagery.',
  },
  {
    norad: [31698],
    displayName: 'TerraSAR-X',
    operator: 'DLR / Airbus',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 13.8, // 15° incidence (data access range), Airbus product guide
    blurb: 'German X-band radar satellite, imaging since 2007.',
  },
  {
    norad: [36605],
    displayName: 'TanDEM-X',
    operator: 'DLR / Airbus',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 13.8, // 15° incidence (data access range), DLR
    blurb: 'Flies in close formation with TerraSAR-X to map Earth’s topography by radar.',
  },
  {
    namePattern: '^(COSMO-SKYMED|CSG-)\\s?\\d$',
    operator: 'ASI',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 16.2, // 18° incidence (first generation; CSG's beams start 16.4° off nadir), ASI
    blurb: 'Italian X-band radar satellite of the COSMO-SkyMed system.',
  },
  {
    norad: [43215],
    displayName: 'PAZ',
    operator: 'Hisdesat',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 13.8, // 15° incidence (data access range), Hisdesat PAZ products guide
    blurb: 'Spanish X-band radar satellite.',
  },
  {
    norad: [32382],
    displayName: 'RADARSAT-2',
    operator: 'MDA',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 45,
    minOffNadirDeg: 8.8, // 10° incidence (Extended Low beam), MDA product description
    blurb: 'Canadian C-band radar satellite, imaging since 2007.',
  },
  {
    namePattern: '^RCM-\\d$',
    operator: 'CSA',
    category: 'radar',
    resolutionM: 3,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 15.7, // 17.3° incidence (a 30 m ScanSAR beam's near edge), CSA
    blurb: 'One of three satellites of the Canadian RADARSAT Constellation Mission.',
  },
  {
    norad: [43641, 46265],
    namePattern: '^SAOCOM 1[AB]$',
    operator: 'CONAE',
    category: 'radar',
    resolutionM: 10,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 15.9, // 17.6° incidence (quad-pol beam S1), CONAE
    blurb: 'Argentine L-band radar satellite that also measures soil moisture.',
  },
  {
    norad: [39766],
    displayName: 'ALOS-2',
    operator: 'JAXA',
    category: 'radar',
    resolutionM: 3,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 7.2, // 8° incidence, JAXA
    blurb: 'Japanese L-band radar satellite, imaging since 2014.',
  },
  {
    norad: [60182],
    displayName: 'ALOS-4',
    operator: 'JAXA',
    category: 'radar',
    resolutionM: 3,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 7.2, // 8° incidence, JAXA
    blurb: 'Japanese L-band radar satellite, successor to ALOS-2.',
  },
  {
    norad: [65053],
    displayName: 'NISAR',
    operator: 'NASA / ISRO',
    category: 'radar',
    swathKm: 242,
    maxOffNadirDeg: 40,
    minOffNadirDeg: 28.2, // 32° incidence: a fixed swath, ~34–47°, NISAR handbook
    blurb: 'Dual-band radar that maps a 242 km swath to measure how the ground moves.',
  },
  {
    namePattern: '^SUPERVIEW NEO-2 ',
    operator: 'Siwei',
    category: 'radar',
    maxOffNadirDeg: 40,
    minOffNadirDeg: 4.5, // not published: the smallest any radar here publishes (ICEYE's)
    blurb: 'Chinese commercial X-band radar satellite.',
  },
  {
    namePattern: '^GAOFEN-3( 0[23])?$',
    operator: 'CNSA',
    category: 'radar',
    resolutionM: 1,
    maxOffNadirDeg: 45,
    minOffNadirDeg: 8.9, // 10° incidence (extended low beam), Sun et al. 2017 via eoPortal
    blurb: 'Chinese government C-band radar satellite.',
  },
  {
    namePattern: '^GAOFEN-12 0\\d$',
    operator: 'CNSA',
    category: 'radar',
    maxOffNadirDeg: 40,
    minOffNadirDeg: 4.5, // not published: the smallest any radar here publishes (ICEYE's)
    blurb: 'Chinese government radar satellite; its specifications are not published.',
  },

  // ───────────────────────────── crewed ─────────────────────────────
  {
    norad: [25544],
    displayName: 'ISS',
    operator: 'NASA / Roscosmos / ESA / JAXA / CSA',
    category: 'crewed',
    blurb: 'The International Space Station, continuously crewed since November 2000.',
  },
  {
    norad: [48274],
    displayName: 'Tiangong',
    operator: 'CMSA',
    category: 'crewed',
    blurb: 'China’s space station, built around the Tianhe core module launched in 2021.',
  },
]

// ───────────────────────────── resolution ─────────────────────────────

const byNorad = new Map<number, SatProfile>()
const patterns: { re: RegExp; profile: SatProfile }[] = []
for (const p of PROFILES) {
  for (const id of p.norad ?? []) byNorad.set(id, p)
  if (p.namePattern) patterns.push({ re: new RegExp(p.namePattern, 'i'), profile: p })
}

/** Resolve a profile from a NORAD id and (optionally) the catalog name. */
export function resolveProfile(norad: number, name?: string): SatProfile | undefined {
  const exact = byNorad.get(norad)
  if (exact) return exact
  if (!name) return undefined
  for (const { re, profile } of patterns) if (re.test(name)) return profile
  return undefined
}

/** STAC platform string (e.g. "sentinel-2c", "landsat-9") → NORAD id. Case-insensitive. */
export function noradForPlatform(platform: string): number | undefined {
  const key = platform.trim().toLowerCase()
  for (const p of PROFILES) if (p.stac && p.stac.platform === key && p.norad?.length === 1) return p.norad[0]
  return undefined
}

/** GIBS collection (e.g. "gibs-viirs-noaa20") → NORAD id of the satellite behind it. */
export function noradForGibsCollection(collection: string): number | undefined {
  for (const p of PROFILES) if (p.gibs && p.gibs.collection === collection && p.norad?.length === 1) return p.norad[0]
  return undefined
}

// ───────────────────────────── display names ─────────────────────────────

/** Brand casing for constellation names that are written in caps in the catalog. */
const BRAND_CASE: Record<string, string> = {
  SKYSAT: 'SkySat',
  FLOCK: 'Flock',
  PELICAN: 'Pelican',
  LEGION: 'WorldView Legion',
  CAPELLA: 'Capella',
  UMBRA: 'Umbra',
  STRIX: 'StriX',
  JILIN: 'Jilin',
  GAOFEN: 'Gaofen',
  KUANFU: 'Kuanfu',
  SUPERVIEW: 'SuperView',
  NEO: 'Neo',
  PLEIADES: 'Pléiades',
  FENGYUN: 'Fengyun',
  GLOBAL: 'BlackSky Global',
  OBJECT: 'Object',
  SKYMED: 'SkyMed',
}

/**
 * Human display name. Curated single-satellite profiles carry their own; constellation members get the
 * catalog name with brand casing and without the trailing parenthetical alias, e.g.
 *   "CAPELLA-14 (ACADIA-4)" → "Capella-14",  "LEGION 3" → "WorldView Legion 3".
 * Uncurated objects keep the catalog name verbatim.
 */
export function displayNameFor(name: string, profile?: SatProfile): string {
  if (profile?.displayName) return profile.displayName
  if (!profile) return name
  const base = name.replace(/\s*\(.*\)\s*$/, '').trim()
  return base
    .split(/(\s+|-)/)
    .map((tok) => BRAND_CASE[tok.toUpperCase()] ?? tok)
    .join('')
}
