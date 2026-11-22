/**
 * The Vietnamese verdict vocabulary (see src/i18n/en/verdicts.ts; docs/i18n/vi.md §3.7 is the authority). One table,
 * read everywhere a verdict is named.
 *
 * Why these words: the ladder must read in order at a glance. *Đã quan sát* is the product verb, done. *Nhiều khả năng*
 * ("most likely") is the measured hedge of the news register, well above *Có thể* ("could"); *Có lẽ* was rejected
 * because it shares *có* with the could verdict and reads as a guess. The lanes are one or two words: the likely lane
 * is the verdict's own verb, *Quét qua* ("swept over"), because a bare *Khả năng* reads "ability" as readily as
 * "likelihood". Every verdict counts passes with *lượt*, which takes no plural (Vietnamese has none), so one function
 * serves every count.
 */
import type en from '../en/verdicts'

/** "1 lượt", "31 lượt": the count word for occurrences (*lượt xem*), standing for *lượt bay qua* */
const passes = (_n: number) => 'lượt'

const verdicts: typeof en = {
  imaged: {
    // No-break spaces hold each title's phrases whole where a header or tile wraps it (vi.md §6.5): never *ĐÃ QUAN /
    // SÁT* (the pass list's header at 390 px), never a line ending on *đã*.
    title: 'Đã\u00a0quan\u00a0sát',
    short: 'Ảnh',
    unit: passes,
    definition: 'Có ảnh thật của nơi này trong một kho lưu trữ công khai.',
    verb: 'đã quan sát',
  },
  likely: {
    title: 'Nhiều\u00a0khả\u00a0năng đã\u00a0quan\u00a0sát',
    short: 'Quét qua',
    unit: passes,
    /** *camera hướng cố định*: a camera whose pointing is fixed (*camera cố định* would be a CCTV) */
    definition: 'Dải quét của một camera hướng cố định đã phủ nơi này. Chưa có ảnh nào của nơi này được công bố.',
    verb: 'đã quét qua',
  },
  could: {
    // Two phrases, so the tile wraps as CÓ THỂ / ĐÃ HƯỚNG VỀ ĐÂY (phones), never with *đã* or *ĐÂY* alone at a line end.
    title: 'Có\u00a0thể đã\u00a0hướng\u00a0về\u00a0đây',
    short: 'Có thể',
    unit: passes,
    /** "In range" of a camera that can turn is *trong tầm với* (reach), as About explains the same verdict */
    definition: 'Nơi này đã nằm trong tầm với của một camera xoay hướng được hoặc của tư nhân. Nhà vận hành không cho biết camera có nhìn về đây hay không.',
    verb: 'đã bay qua trong tầm nhìn',
  },
  overhead: {
    title: 'Bay qua trên đầu',
    short: 'Bay qua',
    unit: passes,
    /** The English fragment "Stations and everything else." needs a verb in Vietnamese: *Gồm …* */
    definition: 'Đã băng qua bầu trời của bạn. Gồm các trạm vũ trụ và mọi thứ khác.',
    verb: 'đã bay qua trên đầu',
  },
}
export default verdicts
