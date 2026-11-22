/**
 * Vietnamese copy for the app's own words (see docs/i18n/vi.md §3.8): the fault notice, the controller's progress
 * lines and the tab title. Faults say what failed, then what to do, with no *Rất tiếc* and no *Vui lòng* (§1.1): the
 * English never apologises. The usage stats keep logging the ENGLISH sentence of each fault, whatever is shown here.
 */
import type en from '../en/app'

const app: typeof en = {
  /** The brand first, then the hero as one sentence without its full stop (§3.1) */
  documentTitle: 'Watched · Tuần này, có thứ gì đó quan sát bạn',

  notice: {
    /** The instrument's word for a failure, not *Lỗi!* */
    label: 'Sự cố',
    fallback: 'Đã xảy ra lỗi.',
    tryAgain: 'Thử lại',
    trying: 'Đang thử…',
    back: 'Quay lại',
  },

  /**
   * "your connection" needs no *của bạn*: whose it is goes without saying (§1.2 rule 1). The notice is a short block
   * on a phone, so its compounds are held whole (at 360 px it set as *Kiểm / tra*).
   */
  faults: {
    catalog: 'Không tải được danh mục quỹ\u00a0đạo. Kiểm\u00a0tra kết\u00a0nối rồi thử\u00a0lại.',
    compute: 'Đã xảy ra lỗi khi tính các lượt bay qua nơi này. Thử\u00a0lại sau giây\u00a0lát.',
  },

  progress: {
    catalog: 'Đang tải tham số quỹ đạo',
    done: 'Báo cáo đã sẵn sàng',
  },
}
export default app
