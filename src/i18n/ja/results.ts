/**
 * Japanese copy for the results panel (see docs/i18n/ja.md §3.3 for the headline and its second line, §3.5 for the
 * verdicts, §3.7 "engine" and "Results UI not yet in a catalog" for the rest).
 *
 * Why the words are these: the headline keeps the English shape in Japanese order, 過去7日間、**256基の衛星が***Waterloo*を
 * 見ていた。: a duration with ていた takes no particle (過去7日間に would suggest one moment), the bold run is the count
 * phrase with its counter 基, and the accent covers the place name only, never its particle. A rolling week is この1週間
 * (今週 is the calendar week, kept for the brand lines: the invitation echoes the hero, 今週、何かがあなたも見ていた。).
 * The second line ends on the number, 公開された画像は31枚。, so 少なくとも ("at least") sits right before it and can fade
 * out in place. Japanese has one plural category, so every count is one string; where English has a sentence for none,
 * Japanese has its own (…どれも見ていなかった。, …公開された画像はない。), never 0基. Counters attach without a space
 * (基 satellites, 枚 images, 回 passes, 件 scenes); SI units take one (786 km). Mono labels are short kanji nouns, status
 * lines end in 中 or 済み, buttons are nouns or dictionary forms, and nothing is polite (no です／ます, no ください).
 * Mono dates come from the ja 'time' namespace (11/1(日), 10/29 → 11/5) and prose dates from Intl (10月29日), so this
 * panel and the pass list agree to the letter. Place and satellite names arrive bare and take particles directly.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import { fmt } from '../../../api/_lib/i18n/format'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import jaTime from './time'

const f = fmt('ja')
type Verdict = Pass['verdict']

/** "11/1(日)" / "10/29" at a zone: the ja 'time' forms, from the instant */
const day = (ms: number, timeZone: string) => jaTime.day(ms, timeZone, localParts(ms, timeZone))
const dayMonth = (ms: number, timeZone: string) => jaTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
/** "10月29日": a day in prose, no weekday (the headline's older window) */
const dayProse = (ms: number, timeZone: string) => formatDate('ja', ms, timeZone, { month: 'long', day: 'numeric' })

/**
 * Names in a list: "Umbra", "UmbraとCapella", "Umbra、Capella、ICEYE-X2". Two names are joined by hand, because
 * Intl.ListFormat gives "Umbra、Capella" for two, which reads as a broken list.
 */
const nameList = (items: readonly string[]) => (items.length === 2 ? `${items[0]}と${items[1]}` : f.list(items))

/**
 * What was checked: "確認したのは、観測衛星と有人ステーション計250基の通過1,234回。" (a noun ending, so it reads for 0
 * too). 計 makes the count the total of both kinds; without it 250基 attaches to the nearest noun (the stations)
 */
const checkedJa = (passes: number, sats: number) => `確認したのは、観測衛星と有人ステーション計${f.int(sats)}基の通過${f.int(passes)}回。`

/** A pass's mark in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': '公開アーカイブの観測衛星 · ◇',
  'commercial-optical': '商業衛星 · □',
  radar: 'レーダー衛星 · ▣',
  'weather-leo': '気象衛星 · ○',
  crewed: '有人ステーション · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    /** "過去7日間、**256基の衛星が***Waterloo*を見ていた。" / "10月29日から11月5日まで、**12基の衛星が***Waterloo*を見ていた。" */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? `過去${f.int(when.lastDays)}日間、`
        : `${dayProse(when.fromMs, when.timeZone)}から${dayProse(when.toMs, when.timeZone)}まで、`,
      strong(num(f.int(n)), '基の衛星が'),
      accent(place),
      'を見ていた。',
    ],
    /** "この1週間、追跡中の衛星はどれも*Waterloo*を見ていなかった。" (no bold run: there is no count) */
    none: (place: string, past: boolean): Rich => [`${past ? 'その' : 'この'}1週間、追跡中の衛星はどれも`, accent(place), 'を見ていなかった。'],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  /**
   * "公開された画像は31枚。" / "公開された画像は少なくとも31枚。": the strong part is 少なくとも, right before the number,
   * so the sentence reads with and without it. One form for every count, 1 included
   */
  imagesPublic: (k: number): Rich => ['公開された画像は', strong('少なくとも'), num(f.int(k)), '枚。'],
  noImages: { thisWeek: 'この1週間に公開された画像はない。', thatWeek: 'その1週間に公開された画像はない。' },
  archiveDown: '画像アーカイブが応答せず、公開画像をいま数えられない。',
  tryAgain: '再試行',
  share: '共有',
  /** "Waterlooのこの1週間を共有" */
  shareWeekLabel: (place: string, past: boolean) => `${place}の${past ? 'その' : 'この'}1週間を共有`,

  why: {
    sunNeverRose: '太陽が一度も昇らず、日光が必要なカメラにはこの場所が見えなかった。',
    sunBarelyRose: '太陽がほとんど昇らず、日光が必要なカメラにはこの場所が見えなかった。',
    /** "それでも気象衛星は赤外線でこの場所を42回走査した。" (1回 for once) */
    infrared: (n: number): Rich => ['それでも気象衛星は赤外線でこの場所を', num(f.int(n)), '回走査した。'],
    /**
     * "…Umbra、Capellaほかレーダー衛星7基が…" / "…UmbraとCapellaが…" / "…Umbraが…": named satellites plus the count of
     * the others (ほか), as English counts them
     */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = `レーダー衛星${f.int(others)}基`
      const who = others > 0 ? (names.length ? `${f.list(names)}ほか${rest}` : rest) : nameList(names)
      return ['レーダーに光はいらない。', `${who}が、この場所を観測できる範囲を計`, num(f.int(passes)), '回通った。']
    },
    /** "Sentinel-2かLandsatが日中にこの場所を3回通ったが、シーンはまだ公開されていない。" (once → 1回) */
    unpublished: (n: number) => `Sentinel-2かLandsatが日中にこの場所を${f.int(n)}回通ったが、シーンはまだ公開されていない。`,
    none: '画像を公開している観測衛星は、日中にこの場所を通らなかった。',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: '判定別の通過。それぞれの一覧へ移動する。',
  /** "31回：見ていた" (every verdict counts passes with 回) */
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${f.int(n)}回：${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    /**
     * "詳細画像**12**枚（Sentinel-2、Landsat、10〜30 m） · 気象衛星の日別画像**3**枚（250〜375 m） · …。確認したのは、…。"
     * Each count is bold (a strong part) with its counter right after it; the footnote is prose, so its ranges take 〜
     * and its parentheses are full-width
     */
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = ['詳細画像', strong(f.int(o.detailed)), '枚（Sentinel-2、Landsat、10〜30 m）']
      if (o.mosaics) out.push(' · 気象衛星の日別画像', strong(f.int(o.mosaics)), '枚（250〜375 m）')
      if (o.radar) out.push(' · レーダー画像', strong(f.int(o.radar)), '枚（Sentinel-1、20 m）')
      if (o.geo) out.push(' · 静止気象衛星の全球画像', strong(f.int(o.geo)), '枚（2〜5 km、表示は各衛星の最新の1枚）')
      out.push(`。${checkedJa(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedJa(passes, satellites),
    /** "通過時刻は、各衛星がWaterlooに最も近づいた時刻。公開の軌道要素（取得 2026-11-08 03:31Z）から計算している。…" */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `通過時刻は、各衛星が${place}に最も近づいた時刻。公開の軌道要素${fetched ? `（取得 ${fetched}）` : ''}から計算している。` +
      `現地時間は${zoneLabel}。`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `${place}の上空を通った衛星`,
  computingPasses: '通過を計算中',
  /**
   * "03 / 常時観測": a kanji noun like every other section rule (mono labels take no verb); 観測 because it says what
   * geostationary imagers do in general
   */
  sections: { summary: '概要', passes: '通過', watchedContinuously: '常時観測' },
  checkingArchives: 'アーカイブを確認中',
  invite: {
    /** One of the sanctioned あなた lines: the post hook's echo of the hero */
    text: '今週、何かがあなたも見ていた。',
    /** 自分の場所: "your place" without あなた */
    checkPlace: '自分の場所を検索',
    dismiss: '閉じる',
  },
  searchAnother: '別の場所を検索',
  allPasses: 'すべての通過',

  footer: {
    replay: 'リプレイ',
    replayLabel: 'この通過をリプレイ',
    replayTitle: 'この通過を地球儀でリプレイ',
    shareLabel: { pass: 'この通過を共有', image: 'この画像を共有' },
    /** Narrow phones show 共有 alone; elsewhere この通過を共有 */
    shareButton: { pass: [strong('この通過を'), '共有'] as Rich, image: [strong('この画像を'), '共有'] as Rich },
    /** Narrow phones show 自分の場所 alone (a noun, as a button may be) */
    checkPlace: ['自分の場所', strong('を検索')] as Rich,
    /** The week's clear picture: 晴天画像 alone on narrow phones */
    clearest: ['晴天画像', strong('を見る')] as Rich,
    clearestLabel: '晴天画像を見る',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    /** "7日間 · 11/1 → 11/8" */
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${f.int(days)}日間 · ${jaTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: '気象画像を確認中',
    cancel: 'キャンセル',
    newSearch: '新規検索',
    close: '閉じる',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `別の場所を検索（現在：${place}）`,
    change: '変更',
    computing: '計算中',
    recent: '最近の検索',
    /** "この種類の通過、12回中3回目": total first */
    position: (k: number, n: number) => `この種類の通過、${f.int(n)}回中${f.int(k)}回目`,
    previous: 'この種類の前の通過',
    next: 'この種類の次の通過',
    previousTitle: '前へ(←)',
    nextTitle: '次へ(→)',
    allPassesTitle: 'すべての通過(Esc)',
    /**
     * "共有リンク · Sentinel-2CがWaterlooを見ていた": the link, not 共有された通過, because the tag stays over every pass
     * while a shared link is open, and a shared geostationary image is a scan, not a pass
     */
    shared: (sat: string, place: string) => `共有リンク · ${sat}が${place}を見ていた`,
    /** "11/1(日) · 16:14:21 EST", as the pass list's stamp writes it; ≈ stays in mono */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${jaTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    /** Labels are nouns; a finished step is noun + 済み */
    stages: {
      catalog: { idle: '軌道カタログ', done: 'カタログ読み込み済み' },
      propagate: { idle: (days: number) => `軌道計算 · ${f.int(days)}日間`, done: '軌道計算済み' },
      archive: { idle: 'Sentinel-2とLandsatのアーカイブ', done: 'アーカイブ検索済み' },
      match: { idle: 'シーンと通過の照合', done: 'シーン照合済み' },
    },
    ready: 'レポート完成',
    ok: 'OK',
    /** "1.84秒": a Latin "s" is a clipping Japanese readers do not use */
    seconds: (s: number) => `${f.dec(s, 2)}秒`,
    /** "**7日間 · **11/1 05:47 → 11/8 05:47 UTC" (the strong part hides on phones; 時間枠 would cut the end on laptops) */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${f.int(days)}日間 · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary ComputerとNASAは画像をその都度生成するため、この段階には数秒かかることがある。',
    /** 軌道計算のみ, the engine footnotes' words for "from orbital geometry only" (./engine.ts note.archiveSlow) */
    verySlow: '画像アーカイブの応答が遅れている。応答がなければ、通過は軌道計算のみで示し、そのことを注記する。',
    /** "共有された、Sentinel-2CによるWaterlooの画像。" (no name: ある衛星) */
    sharedAlt: (sat: string | undefined, place: string) => `共有された、${sat ?? 'ある衛星'}による${place}の画像。`,
    /** "**共有リンク** · Sentinel-2CがWaterlooを見ていた · 11/1(日) 16:14" (the same word as the pass header's tag) */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('共有リンク'),
      ` · ${sat ?? 'ある衛星'}が${place}を見ていた${when ? ` · ${day(when.ms, when.timeZone)} ${when.time}` : ''}`,
    ],
  },

  // ── 03 / geostationary weather satellites ────────────────────────────────────────────────
  geo: {
    none: '仰角5°より上からこの場所を見る、運用中の静止気象衛星はない。',
    /** "0.0°E · 仰角 42.3° · 10分ごと" */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => `${lon} · 仰角 ${f.dec(elevationDeg, 1)}° · ${f.int(cadenceMin)}分ごと`,
    /** "この1週間に1,008枚" / "3日間に432枚" */
    images: (n: number, days: number): Rich =>
      days === 7 ? ['この1週間に', num(f.int(n)), '枚'] : [`${f.int(days)}日間に`, num(f.int(n)), '枚'],
    replay: 'リプレイ',
    replayLabel: (sat: string) => `${sat}：最新の画像をリプレイ`,
    /**
     * In the 72 px frame: 62 px of text, 6 glyphs a line on desktops and 5 on phones. Each word fits on one line, so no
     * kana or kanji is left alone on a second one
     */
    frame: {
      probing: '確認中…',
      noPublic: '画像非公開',
      poorQuality: '低画質',
      /** The service did not answer */
      noneNow: '応答なし',
      /** The picture would not load (〜不可, as 検索不可 and カタログ取得不可) */
      unavailable: '表示不可',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}：この場所周辺の最新の${infrared ? '赤外' : ''}画像`,
    infraredChip: '赤外',
    infraredTitle: '赤外：雲頂を温度で表示。冷たいほど明るい',
  },

  // ── 04 / timeline ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'タイムライン',
    meta: (days: number, zoneLabel: string, zones?: string) => `${f.int(days)}日間 · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'この場所の日中',
    /**
     * "タイムライン、7日間。見ていた：12回、おそらく見ていた：3回、…。" A verdict name cannot follow a bare count in
     * Japanese, so each name comes first, with a colon before its count (as the readouts' 31回：見ていた, reversed)
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `タイムライン、${f.int(days)}日間。` + VERDICT_ORDER.map((v) => `${titles[v]}：${f.int(counts[v])}回`).join('、') + '。',
    keysHint: (summary: string) => `${summary}左右の矢印キーで通過を順に移動できる。`,
    /** "静止 · 3": the strong part hides up to 1180 px */
    geoLane: (n: number): Rich => [strong('静止 · '), String(n)],
    geoNames: (names: readonly string[]) => nameList(names),
    now: '現在',
    /** "傾き 8.9° · 61 km" */
    geometry: (deg: number, km: number) => `傾き ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `日別画像、${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `レーダー画像、${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'その他'}`,
  },

  // ── 02 / replay ──────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: '通過中のリプレイ時刻',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}、${utc}`,
    play: 'リプレイを再生',
    pause: 'リプレイを一時停止',
    speed: 'リプレイ速度',
    /**
     * "見える範囲内 4分12秒": the glossary's 見える範囲 (the pass view's label for the same span), with 内 so the duration
     * reads as the time spent inside it
     */
    inView: (duration: string) => `見える範囲内 ${duration}`,
    closest: '最接近',
    spaceKey: 'スペース',
    playPause: '再生 / 一時停止',
    stepKind: 'この種類の前 / 次の通過',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) => `平面図：${sat}の地上軌跡。最接近時、この場所から${f.int(km)} km。`,
    northUp: '平面図 · 北が上',
    fieldOfRegard: (deg: number) => `指向範囲 ±${deg}°`,
    swath: (km: number) => `観測幅 ${f.int(km)} km`,
    groundTrack: '地上軌跡',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    /** 最短距離: 最接近 is a moment, not a distance */
    closest: (km: number) => `最短距離 ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `日別画像 · ${m} m`,
    fullDisc: (km: number) => `全球画像 · ${km} km`,
    infrared: (km: number) => `赤外画像 · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1レーダー · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'タイムラプス',
    sub: 'この場所の年ごとの変化',
  },
}
export default results
