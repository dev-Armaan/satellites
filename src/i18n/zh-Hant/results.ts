/**
 * Traditional Chinese copy for the results panel (see docs/i18n/zh-Hant.md §3.3, §3.4, §3.6, §4.1, §5, Appendix A):
 * the headline and its second line, the reasons no image was made public, the readouts and footnotes, the computing
 * readout, the headers and footer, the timeline, the replay, the plan view, the geostationary list, the product lines
 * and the time-lapse row.
 *
 * Why it reads this way:
 *  - The headline is the product's finding, in the guide's frame: 過去 7 天，有 **256 顆衛星注視過** *Waterloo*。 The bold
 *    is the number, its counter, the noun and the verb; 有 (without it a numbered subject reads like a newspaper
 *    headline) and the window phrase stay regular; the place alone is the serif accent and 。 sits outside it. An older
 *    window is two day tokens joined by 至 (10月29日至11月5日). The zero headline is its own sentence, as zh has one
 *    plural category: one form per count, a zero only where the sentence changes.
 *  - The second line is 已有 [NUM] 張影像公開。 with 至少 as the removable prefix, so it reads whole with and without
 *    it; it always says 影像, never 照片, because the one count holds radar and full-disc frames too.
 *  - Counts are number + counter + noun (顆衛星, 張影像, 次過境), never an English singular / plural branch. Lists of names
 *    are built by hand (、 between names, 和 before the last), not with Intl.ListFormat, whose zh-Hant output drops the
 *    space before a digit and whose Hong Kong output says 及.
 *  - Every inserted name (place, satellite) is spaced from Han by cjkGap (withName): "注視過 Waterloo。" but
 *    "注視過九龍。"; never a space next to full-width punctuation. Dates are built from the place's local fields through
 *    the zh-Hant 'time' namespace, so a header and its row in the list agree (11月1日 週日 · 16:14:21 EST).
 *  - "this week" / "that week" are 這星期 / 那個星期; "clear" is 無雲 and "closest look" 最清晰的一張; "in view"
 *    is 可視範圍 everywhere; geostationary is 地球同步 (its timeline lane 同步軌道). Mono labels are nouns, stored as
 *    written: Han has no case, and CSS uppercases the Latin in them.
 *  - Hong Kong's 日 (every catalog-built count of days, §1.4) belongs to the zh-Hant-HK overlay, not here: each key
 *    that counts days carries its overlay form in its comment, since §1.4's key list names only the headline's.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import { cjkGap, keepName, withName } from '../../../api/_lib/i18n/card/zh-Hant'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import zhTime from './time'
import zhVerdicts from './verdicts'

const f = fmt('zh-Hant')
type Verdict = Pass['verdict']

/** "10月29日" / "11月1日 週日" at a zone: the zh-Hant 'time' forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => zhTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => zhTime.day(ms, timeZone, localParts(ms, timeZone))

/** A gap only where one is needed, as its own text part (no empty parts) */
const gapPart = (before: string, after: string): Part[] => {
  const g = cjkGap(before, after)
  return g ? [g] : []
}

/**
 * "Umbra"、"Umbra 和 Capella"、"Umbra、Capella 和另外 7 顆雷達衛星": 、 between items with no space, 和 before the
 * last, spaced from a Latin name by cjkGap (§5.4). Never Intl.ListFormat ("Capella和7 顆"; HK 及).
 */
function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  const head = items.slice(0, -1).join('、')
  const last = items[items.length - 1]
  return `${head}${cjkGap(head, '和')}和${cjkGap('和', last)}${last}`
}

/** "已檢查 250 顆成像與載人衛星的 1,234 次過境。" */
const checkedZh = (passes: number, sats: number) => `已檢查 ${f.int(sats)} 顆成像與載人衛星的 ${f.int(passes)} 次過境。`

/**
 * What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape.
 * "open imager" is said as why.none says it (影像公開的成像衛星): every satellite in the catalog is publicly known, so
 * 公開成像衛星 would not mark what sets Sentinel-2 and Landsat apart, which is that their images are public
 */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': '影像公開的成像衛星 · ◇',
  'commercial-optical': '商業衛星 · □',
  radar: '雷達衛星 · ▣',
  'weather-leo': '氣象衛星 · ○',
  crewed: '載人太空站 · ✛',
}

/** A nameless satellite as a subject (有一顆衛星注視過 Waterloo); as a modifier it is 衛星 itself (Waterloo 的衛星影像) */
const A_SATELLITE_SUBJECT = '有一顆衛星'

/** "Sentinel-2C 注視過 Waterloo" / "有一顆衛星注視過九龍": a satellite, the verdict's verb, the place */
const satWatched = (sat: string | undefined, place: string) => withName(withName('', sat ?? A_SATELLITE_SUBJECT, '注視過'), place, '')

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    /**
     * "過去 7 天，有 **256 顆衛星注視過** *Waterloo*。" / "10月29日至11月5日，有 **2 顆衛星注視過** *九龍*。"
     * zh-Hant-HK overlay (§1.4): `過去 ${f.int(when.lastDays)} 日` in the window phrase
     */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${'lastDays' in when ? `過去 ${f.int(when.lastDays)} 天` : `${dayMonth(when.fromMs, when.timeZone)}至${dayMonth(when.toMs, when.timeZone)}`}，有 `,
      strong(num(f.int(n)), ' 顆衛星注視過'),
      ...gapPart('注視過', place),
      accent(place),
      '。',
    ],
    /** "這星期，我們追蹤的衛星沒有一顆注視過 *Waterloo*。" (沒有一顆: "not a single one", the plain emphatic) */
    none: (place: string, past: boolean): Rich => [
      `${past ? '那個星期' : '這星期'}，我們追蹤的衛星沒有一顆注視過`,
      ...gapPart('注視過', place),
      accent(place),
      '。',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  /** "[至少]已有 31 張影像公開。": 至少 is the strong part, removed once the count is final */
  imagesPublic: (k: number): Rich => [strong('至少'), '已有 ', num(f.int(k)), ' 張影像公開。'],
  noImages: { thisWeek: '這星期沒有影像公開。', thatWeek: '那個星期沒有影像公開。' },
  /** Not our error, not an apology: the archives did not answer */
  archiveDown: '影像庫沒有回應，暫時無法計算公開影像的數量。',
  tryAgain: '再試一次',
  share: '分享',
  /** "分享 Waterloo 這星期的結果" */
  shareWeekLabel: (place: string, past: boolean) => withName('分享', place, past ? '那個星期的結果' : '這星期的結果'),

  /** "It" is the searched place: 這裡. No 這星期 in these: the window may be an older week */
  why: {
    /** 一直沒有: "not, the whole time", never 從未 ("never, ever") */
    sunNeverRose: '太陽一直沒有升起，所以沒有日間相機看得到這裡。',
    sunBarelyRose: '太陽幾乎沒有升起，所以沒有日間相機看得到這裡。',
    infrared: (n: number): Rich => ['氣象衛星仍以紅外線掃過這裡 ', num(f.int(n)), ' 次。'],
    /** "雷達不需要光。Umbra、Capella 和另外 7 顆雷達衛星在可視範圍內經過了 1,204 次。" */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const sats = names.map(keepName)
      const rest = others > 0 ? [sats.length ? `另外 ${f.int(others)} 顆雷達衛星` : `${f.int(others)} 顆雷達衛星`] : []
      const who = list([...sats, ...rest])
      return [`雷達不需要光。${withName('', who, '在可視範圍內經過了 ')}`, num(f.int(passes)), ' 次。']
    },
    /** "Sentinel-2 或 Landsat 在白天飛越這裡 3 次，但還沒有任何影像公開。" (1 次 alike) */
    unpublished: (n: number) => `Sentinel-2 或 Landsat 在白天飛越這裡 ${f.int(n)} 次，但還沒有任何影像公開。`,
    /**
     * 沒有一顆 ("not a single one"), as in the zero headline. §3.4's 沒有影像公開的成像衛星… also reads as "imaging
     * satellites with no public images crossed here" (沒有X的Y, "Y without X"), close to the `unpublished` reason; 顆
     * counts only the satellite, so 一顆 forces the existential reading
     */
    none: '沒有一顆影像公開的成像衛星在白天飛越這裡。',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: '依判定分類的過境。每一項都可跳到對應的列表。',
  /** "31 次過境：注視過" */
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${zhVerdicts[verdict].unit(n)}：${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    /**
     * "12 張精細影像（Sentinel-2、Landsat，10–30 m）· 3 張每日氣象拼接影像（250–375 m）· …。已檢查 …。" Every piece ends
     * in ）, so the separator has no leading space (§6.1)
     */
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(f.int(o.detailed)), ' 張精細影像（Sentinel-2、Landsat，10–30 m）']
      if (o.mosaics) out.push('· ', strong(f.int(o.mosaics)), ' 張每日氣象拼接影像（250–375 m）')
      if (o.radar) out.push('· ', strong(f.int(o.radar)), ' 張雷達影像（Sentinel-1，20 m）')
      if (o.geo) out.push('· ', strong(f.int(o.geo)), ' 張地球同步氣象衛星的全圓盤影像（2–5 km；各顯示最新一張）')
      out.push(`。${checkedZh(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedZh(passes, satellites),
    /**
     * "…最接近 Waterloo 的時刻，根據公開的軌道資料（更新於 2026-11-08 03:31Z）計算。當地時間：America/Toronto。" The
     * stamp dates the orbital elements, so its parenthesis follows 軌道資料 (a Chinese parenthesis glosses the word
     * before it: after 計算 it would date the calculation)
     */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `${withName('過境時間是每顆衛星最接近', place, '的時刻')}，根據公開的軌道資料` +
      `${fetched ? `（更新於 ${fetched}）` : ''}計算。當地時間：${zoneLabel}。`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  /** "Waterloo 上空的衛星" */
  sheetLabel: (place: string) => withName('', place, '上空的衛星'),
  computingPasses: '正在計算過境',
  sections: { summary: '摘要', passes: '過境', watchedContinuously: '持續注視' },
  checkingArchives: '正在檢查影像庫',
  invite: {
    /** The share hook, kept in step with the hero (§3.1) */
    text: '這星期，也有東西注視過你。',
    checkPlace: '看看你的地點',
    dismiss: '關閉',
  },
  searchAnother: '搜尋其他地點',
  allPasses: '所有過境',

  footer: {
    replay: '重播',
    replayLabel: '重播這次過境',
    replayTitle: '在地球上重播這次過境',
    shareLabel: { pass: '分享這次過境', image: '分享這張影像' },
    /** Narrow phones show 分享 alone */
    shareButton: { pass: ['分享', strong('這次過境')] as Rich, image: ['分享', strong('這張影像')] as Rich },
    /** Narrow phones show 你的地點 alone */
    checkPlace: [strong('看看'), '你的地點'] as Rich,
    /**
     * Narrow phones show 最清晰的一張 alone. 看看, as checkPlace says it: the two share the primary slot, and "See the"
     * is the same soft invitation as "Check" (查看 is a settings-menu verb, §3.2)
     */
    clearest: [strong('看看'), '最清晰的一張'] as Rich,
    clearestLabel: '看看最清晰的一張',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    /** "7 天 · 11月1日 → 8日". zh-Hant-HK overlay (§1.4: 日 for every catalog-built day count): `7 日 · 11月1日 → 8日` */
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${f.int(days)} 天 · ${zhTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: '正在核對氣象拼接影像',
    cancel: '取消',
    newSearch: '重新搜尋',
    close: '關閉',
    escKey: 'Esc',
    /** "搜尋其他地點（目前：Waterloo）" */
    searchBarLabel: (place: string) => `搜尋其他地點（目前：${place}）`,
    change: '更改',
    computing: '計算中',
    recent: '最近搜尋',
    /** "同類過境第 3 次，共 31 次" */
    position: (k: number, n: number) => `同類過境第 ${f.int(k)} 次，共 ${f.int(n)} 次`,
    previous: '上一次同類過境',
    next: '下一次同類過境',
    previousTitle: '上一次（←）',
    nextTitle: '下一次（→）',
    allPassesTitle: '所有過境（Esc）',
    /** "有人分享給你 · Sentinel-2C 注視過 Waterloo" */
    shared: (sat: string, place: string) => `有人分享給你 · ${satWatched(sat, place)}`,
    /** "11月1日 週日 · 16:14:21 EST", exactly as the 'time' namespace's stamp writes it ("≈ 16:14" for a scan) */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${zhTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: '軌道目錄', done: '目錄已載入' },
      /** zh-Hant-HK overlay (§1.4): `推算軌道 · ${f.int(days)} 日` */
      propagate: { idle: (days: number) => `推算軌道 · ${f.int(days)} 天`, done: '軌道已推算' },
      archive: { idle: 'Sentinel-2 + Landsat 影像庫', done: '影像庫已搜尋' },
      match: { idle: '配對影像與過境', done: '影像已配對' },
    },
    ready: '結果已就緒',
    /** Two Han fit the 24 px status cell at the micro size */
    ok: '完成',
    /** "1.84 秒" (§6.9: time units in Han) */
    seconds: (s: number) => `${f.dec(s, 2)} 秒`,
    /**
     * "[7 天 · ]11月1日 05:47 → 8日 05:47 UTC": the rest reads alone on phones. One nowrap mono row beside the
     * percentage (352 px): 時段 adds nothing next to the dates, and the end's month is written only when it changes, as
     * dayRange does, or the row is cut at a month's turn. zh-Hant-HK overlay (§1.4): the strong part `${f.int(days)} 日 · `
     */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => {
      const a = localParts(from.ms, 'UTC')
      const b = localParts(to.ms, 'UTC')
      const end = a.month === b.month && a.year === b.year ? `${b.day}日` : dayMonth(to.ms, 'UTC')
      return [strong(`${f.int(days)} 天 · `), `${dayMonth(from.ms, 'UTC')} ${from.time} → ${end} ${to.time} UTC`]
    },
    percent: (pct: number) => `${f.int(pct)}%`,
    /** 收到請求才產生, never 即時 (that is "Live") */
    slow: 'Planetary Computer 和 NASA 的影像都是收到請求才產生的，這一步可能需要幾秒。',
    verySlow: '影像庫回應很慢。如果一直沒有回應，過境仍會依軌道幾何顯示，我們也會註明。',
    /**
     * "Sentinel-2C 的 Waterloo 影像，有人分享給你。" (as gallery.photoAlt; no 拍攝, no 照片: it may be radar). Nameless:
     * "Waterloo 的衛星影像，有人分享給你。": "A satellite image" is the compound, not "an image of one satellite's", so
     * 一顆衛星的 Waterloo 影像 would be a calque
     */
    sharedAlt: (sat: string | undefined, place: string) =>
      `${sat ? withName(withName('', sat, '的'), place, '影像') : withName('', place, '的衛星影像')}，有人分享給你。`,
    /** "[有人分享給你] · Sentinel-2C 注視過 Waterloo · 11月1日 週日 16:14" */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('有人分享給你'),
      ` · ${satWatched(sat, place)}${when ? ` · ${day(when.ms, when.timeZone)} ${when.time}` : ''}`,
    ],
  },

  // ── 03 / 持續注視: geostationary weather satellites ──────────────────────────────────────
  geo: {
    none: '沒有運作中的地球同步氣象衛星能以 5° 以上的仰角看到這個地點。',
    /** "0.0°E · 仰角 32.1° · 每 10 分鐘" */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => `${lon} · 仰角 ${f.dec(elevationDeg, 1)}° · 每 ${f.int(cadenceMin)} 分鐘`,
    /** "這星期 1,008 張影像" / "6 天內 864 張影像". zh-Hant-HK overlay (§1.4), days ≠ 7: `${f.int(days)} 日內 ` */
    images: (n: number, days: number): Rich =>
      days === 7 ? ['這星期 ', num(f.int(n)), ' 張影像'] : [`${f.int(days)} 天內 `, num(f.int(n)), ' 張影像'],
    replay: '重播',
    replayLabel: (sat: string) => `${sat}：重播最新一張影像`,
    frame: {
      probing: '搜尋中…',
      noPublic: '沒有公開影像',
      /**
       * "Poor quality" (DESIGN §7): the picture would be poor, the place being at the rim of the disc. The label says
       * that, not the cause (太靠邊緣 never said the edge of what); 畫質 is avoided (§1.4 splits quality by region)
       */
      poorQuality: '影像欠佳',
      noneNow: '暫時沒有影像',
      unavailable: '無法取得影像',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}：這個地點周圍最新的${infrared ? '紅外線' : ''}影像`,
    infraredChip: '紅外線',
    infraredTitle: '紅外線：以溫度呈現雲頂，越冷越亮',
  },

  // ── 04 / 時間軸 ──────────────────────────────────────────────────────────────────────────
  timeline: {
    title: '時間軸',
    /** "7 天 · America/Toronto · EST". zh-Hant-HK overlay (§1.4): `${f.int(days)} 日 · ${zoneLabel} · ${zones}` */
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${f.int(days)} 天 · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: '當地白天',
    /**
     * "時間軸，7 天：注視過 12 次、很可能注視過 3 次、或許曾對準這裡 0 次、從上空經過 40 次。" Chinese puts the count
     * after the verdict's name (a count before it is not a phrase), so each name is followed by its passes in 次.
     * zh-Hant-HK overlay (§1.4): `時間軸，${f.int(days)} 日：…`
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `時間軸，${f.int(days)} 天：` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${titles[v]} ${f.int(counts[v])} 次`).join('、') +
      '。',
    keysHint: (summary: string) => `${summary}使用左右方向鍵逐次切換過境。`,
    /** "[同步軌道 · ]3": the strong part is hidden up to 1180 px */
    geoLane: (n: number): Rich => [strong('同步軌道 · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join('、'),
    now: '現在',
    /** "側視角 8.9° · 61 km" */
    geometry: (deg: number, km: number) => `側視角 ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `每日拼接影像，${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `雷達影像，${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? '其他'}`,
  },

  // ── 02 / 重播 ────────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: '這次過境的重播時刻',
    /** "T−00:42，16:14:21 UTC" */
    scrubValue: (tMinus: string, utc: string) => `${tMinus}，${utc}`,
    play: '開始重播',
    pause: '暫停重播',
    speed: '重播速度',
    /** "在可視範圍內 4 分 12 秒" */
    inView: (duration: string) => `在可視範圍內 ${duration}`,
    closest: '最接近',
    /** The key cap stays as printed on the key (§6.9) */
    spaceKey: 'Space',
    playPause: '播放／暫停',
    stepKind: '上一次／下一次同類過境',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    /** "平面圖：Sentinel-2C 的地面軌跡，最接近時距離地點 61 km。" */
    label: (sat: string, km: number) => withName('平面圖：', sat, `的地面軌跡，最接近時距離地點 ${f.int(km)} km。`),
    /** No wider than the English pair on the plan's top row */
    northUp: '平面圖 · 北方朝上',
    fieldOfRegard: (deg: number) => `可轉向範圍 ±${deg}°`,
    swath: (km: number) => `掃描帶 ${f.int(km)} km`,
    groundTrack: '地面軌跡',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    /** 最近距離: "closest" as a distance (最近 alone would say "most recent") */
    closest: (km: number) => `最近距離 ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `每日拼接 · ${m} m`,
    fullDisc: (km: number) => `全圓盤 · ${km} km`,
    infrared: (km: number) => `紅外線 · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 雷達 · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  /** Whole numbers, never grouped */
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: '縮時影像',
    sub: '這個地點，逐年變化',
  },
}

export default results
