/**
 * Vietnamese copy the report engine emits (see src/i18n/en/engine.ts; docs/i18n/vi.md §3.8): the computing readout's
 * progress lines and the report's footnotes about degraded data.
 *
 * Why it reads this way: the readout's rows are one mono line of about 30 characters on a 390 px phone (26 at 360),
 * so each is a short status with *Đang* ("now doing"), the count word after the number and no plural (*16.893 vật
 * thể*, *31 lượt*, *12 ảnh*). "Propagate" is said as what it does, *tính quỹ đạo* (compute the orbits), never *lan
 * truyền*. "Scenes" are matched as *ảnh* to stay inside the line. The weather row's counter is cut off on phones in
 * every language (English too: the row ellipsises as one string); that is the readout's layout to fix, reported, not
 * a reason to drop *thời tiết*.
 * Footnotes say what failed and what that means, and quote the verdicts in their own words (*“nhiều khả năng đã quan
 * sát”*, *“đã quan sát”*, §3.7). "N of M" is *N trong số M* (§5.3 rule 4).
 */
import type en from '../en/engine'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('vi')

const engine: typeof en = {
  progress: {
    loadingCatalog: 'Đang tải danh mục quỹ đạo',
    catalog: ({ objects }: { objects: number }) => `Danh mục · ${f.int(objects)} vật thể`,
    propagateStart: ({ orbits, days }: { orbits: number; days: number }) => `Đang tính ${f.int(orbits)} quỹ đạo · ${f.int(days)} ngày`,
    propagating: ({ done, total }: { done: number; total: number }) => `Đang tính quỹ đạo · ${f.int(done)} / ${f.int(total)}`,
    searchingArchives: 'Đang tra kho Sentinel-2 + Landsat',
    matching: ({ scenes, passes }: { scenes: number; passes: number }) => `Đang đối chiếu ${f.int(scenes)} ảnh với ${f.int(passes)} lượt bay`,
    verifyingWeatherStart: 'Đang kiểm tra ảnh thời tiết NASA',
    verifyingWeather: ({ settled, total }: { settled: number; total: number }) =>
      `Đang kiểm tra ảnh thời tiết NASA · ${f.int(settled)} / ${f.int(total)}`,
    done: ({ passes, images }: { passes: number; images: number }) => `${f.int(passes)} lượt · ${f.int(images)} ảnh`,
  },

  note: {
    archiveSlow: 'Kho lưu trữ Sentinel-2 và Landsat phản hồi quá chậm; các lượt bay chỉ được tính theo hình học quỹ đạo.',
    archiveDown: 'Không kết nối được kho lưu trữ Sentinel-2 và Landsat; các lượt bay chỉ được tính theo hình học quỹ đạo.',
    sentinel2Thumbnails: 'Sentinel-2 được liệt kê qua Earth Search; một số ảnh là ảnh thu nhỏ của cả cảnh ảnh, không phải phần ảnh cắt.',
    /** The search failed (*không tìm kiếm được*), not "not found there" (*không tìm được*) */
    sentinel2EarthSearch: 'Sentinel-2 được liệt kê qua Earth Search (không tìm kiếm được trên Planetary Computer).',
    sentinel2Down: 'Không kết nối được kho Sentinel-2; có thể thiếu ảnh Sentinel-2.',
    landsatDown: 'Không kết nối được kho Landsat; có thể thiếu ảnh Landsat.',
    openOcean: 'Điểm này nằm ngoài kế hoạch thu ảnh của Sentinel-2 (biển khơi).',
    elementsOld: ({ days }: { days: number }) => `Tham số quỹ đạo có từ ${f.int(days)} ngày trước, nên giờ bay qua có thể lệch vài\u00a0phút.`,
    elementsNewer: 'Các lượt bay này được dựng lại từ tham số quỹ đạo mới hơn, nên giờ bay qua có thể lệch vài\u00a0phút.',
    /** "VIIRS images the whole globe" is a verb: *chụp*; the demonstrative follows the count (*lượt bay đó* / *các lượt bay đó*) */
    gibsUnconfirmed: ({ n }: { n: number }) =>
      `NASA GIBS xác nhận chậm ${f.int(n)} ảnh VIIRS; VIIRS chụp toàn bộ Trái Đất mỗi ngày, nên ${
        n === 1 ? 'lượt bay đó' : 'các lượt bay đó'
      } vẫn được tính là “đã quan sát”.`,
    gibsSlowAll: 'NASA GIBS không phản hồi kịp, nên ảnh vệ tinh khí tượng không được hiển thị.',
    gibsSlowSome: ({ missing, total }: { missing: number; total: number }) =>
      `NASA GIBS không trả về kịp ${f.int(missing)} trong số ${f.int(total)} ảnh vệ tinh khí tượng; ${
        missing === 1 ? 'lượt bay đó được' : 'các lượt bay đó được'
      } xếp vào “nhiều khả năng đã quan sát”.`,
    gibsDownAll: 'Không kết nối được NASA GIBS, nên ảnh vệ tinh khí tượng không được hiển thị.',
    gibsDownSome: ({ missing, total }: { missing: number; total: number }) =>
      `NASA GIBS không trả về được ${f.int(missing)} trong số ${f.int(total)} ảnh vệ tinh khí tượng; ${
        missing === 1 ? 'lượt bay đó được' : 'các lượt bay đó được'
      } xếp vào “nhiều khả năng đã quan sát”.`,
  },
}
export default engine
