/**
 * Vietnamese blurbs for the satellites (see src/i18n/en/sats.ts; docs/i18n/vi.md §4.1): one plain sentence each, under
 * the satellite's name in the pass view.
 *
 * Why they read this way: an instrument is *cảm biến* (sensor) or *máy chụp* (imager), a picture element *điểm ảnh*,
 * panchromatic *toàn sắc*, a swath *dải quét*, a radar band *băng C / X / L* (the Latin letter kept). "Its …" needs no
 * *của nó*: the sentence sits under the satellite's name, so *Cảm biến VIIRS …* already says whose. A radar *ghi ảnh*,
 * never *chụp*; a pixel is *điểm ảnh 10 m* or *độ phân giải 20 m*, never a bare *20 m* in a list or *ở khoảng 3 m*
 * (a distance); ordinals go after the thing, *Meteosat thứ hai của thế hệ thứ ba*. Numbers take
 * Vietnamese grouping and the decimal comma (*3.040 km*, *1,1 km*), units the SI symbols with a space. Satellite,
 * instrument, constellation, agency and company names stay as they are (Sentinel-2, VIIRS, Maxar, Planet, Tianhe),
 * countries are CLDR `vi`'s (*Trung Quốc*, *Hàn Quốc*, *Italy*). "has watched" (Terra, Aqua) is the product verb,
 * *đã quan sát*.
 */
import type en from '../en/sats'

const sats: typeof en = {
  blurb: {
    // ── Open photo archives ──
    sentinel2: 'Máy chụp đa phổ của Copernicus: 13 kênh, điểm ảnh 10 m, dải quét 290 km.',
    landsat8: 'Operational Land Imager: điểm ảnh màu 30 m và toàn sắc 15 m, trên dải quét 185 km.',
    landsat9: 'Operational Land Imager 2: điểm ảnh màu 30 m và toàn sắc 15 m, trên dải quét 185 km.',

    // ── Weather satellites in polar orbit ──
    noaaViirs: 'Cảm biến VIIRS quét dải rộng 3.040 km, phủ toàn bộ hành tinh hai lần mỗi ngày.',
    suomiNpp: 'Cảm biến VIIRS đầu tiên trên quỹ đạo, quét dải rộng 3.040 km từ năm 2011.',
    terra: 'Cảm biến MODIS đã quan sát toàn bộ hành tinh, mỗi lần một dải 2.330 km, từ năm 1999.',
    aqua: 'Cảm biến MODIS đã quan sát toàn bộ hành tinh, mỗi lần một dải 2.330 km, từ năm 2002.',
    metop: 'Vệ tinh khí tượng quỹ đạo cực của châu Âu; cảm biến AVHRR phủ dải quét 2.900 km với độ phân giải 1,1 km.',
    sentinel3: 'Thiết bị OLCI ghi lại màu sắc của đất liền và đại dương ở 21 kênh, trên dải quét 1.270 km.',
    fengyun3: 'Vệ tinh khí tượng quỹ đạo cực của Trung Quốc; cảm biến MERSI phủ dải quét 2.900 km.',
    fengyun3e: 'Vệ tinh khí tượng Trung Quốc trên quỹ đạo bình minh–hoàng hôn, mang cảm biến MERSI chụp được trong ánh sáng yếu.',

    // ── Geostationary weather satellites ──
    goesEast: 'GOES-East: chụp toàn đĩa châu Mỹ mỗi 10 phút.',
    goesWest: 'GOES-West: chụp toàn đĩa Thái Bình Dương và châu Mỹ mỗi 10 phút.',
    goes16: 'GOES-East trước đây, được giữ lại trên quỹ đạo làm vệ tinh dự phòng.',
    goes17: 'GOES-West trước đây, được giữ lại trên quỹ đạo làm vệ tinh dự phòng.',
    himawari9: 'Vệ tinh khí tượng của Nhật Bản: chụp toàn đĩa châu Á và Thái Bình Dương mỗi 10 phút.',
    himawari8: 'Dự phòng cho Himawari-9.',
    meteosat12: 'Meteosat đầu tiên của thế hệ thứ ba (MTG-I1): chụp châu Âu và châu Phi mỗi 10 phút.',
    meteosat9: 'Phụ trách khu vực Ấn Độ Dương, chụp toàn đĩa mỗi 15 phút.',
    meteosatSecondGen: 'Meteosat thế hệ thứ hai; ở đây không được tính là vệ tinh chụp toàn đĩa nơi này.',
    mtgI2: 'Máy chụp Meteosat thứ hai của thế hệ thứ ba; chưa đảm nhận dịch vụ chính thức.',
    geoKompsat2a: 'Vệ tinh khí tượng của Hàn Quốc: chụp toàn đĩa mỗi 10 phút.',
    fengyun4b: 'Vệ tinh khí tượng địa tĩnh đang hoạt động của Trung Quốc: chụp toàn đĩa mỗi 15 phút.',
    fengyun4a: 'Máy chụp địa tĩnh cũ hơn của Trung Quốc, không được tính là dịch vụ chính.',
    fengyun4c: 'Máy chụp địa tĩnh mới nhất của Trung Quốc; chưa đảm nhận dịch vụ chính thức.',
    insat: 'Vệ tinh khí tượng của Ấn Độ: chụp toàn đĩa mỗi 30 phút.',
    insat3d: 'Vệ tinh khí tượng cũ hơn của Ấn Độ, không được tính là máy chụp đang hoạt động.',
    elektroL: 'Vệ tinh khí tượng địa tĩnh của Nga: chụp toàn đĩa mỗi 30 phút.',
    elektroL2: 'Vệ tinh khí tượng địa tĩnh cũ hơn của Nga, không được tính là máy chụp đang hoạt động.',
    elektroL5: 'Vệ tinh khí tượng địa tĩnh mới nhất của Nga; chưa được tính là đang hoạt động.',

    // ── Commercial and government high-resolution cameras ──
    worldview1: 'Máy chụp toàn sắc với điểm ảnh 50 cm, có thể nghiêng xa khỏi vệt quỹ đạo.',
    worldview2: 'Máy chụp tám kênh với điểm ảnh toàn sắc 46 cm.',
    worldview3: 'Máy chụp với điểm ảnh toàn sắc 31 cm và 16 kênh phổ.',
    geoeye1: 'Máy chụp với điểm ảnh toàn sắc 41 cm, trên quỹ đạo từ năm 2008.',
    worldviewLegion: 'Một trong các máy chụp WorldView Legion của Maxar, điểm ảnh khoảng 30 cm.',
    /** "tasked to point at specific targets": *chụp những địa điểm cụ thể theo yêu cầu* (never *mục tiêu*, §8) */
    skysat: 'Máy chụp linh hoạt của Planet, điểm ảnh khoảng 50 cm; được điều khiển để chụp những địa điểm cụ thể theo yêu cầu.',
    pelican: 'Máy chụp độ phân giải cao linh hoạt thế hệ mới của Planet.',
    superDove: 'Một vệ tinh nhỏ SuperDove của Planet; cả đội vệ tinh chụp phần lớn đất liền trên Trái Đất mỗi ngày, ở độ phân giải khoảng 3 m.',
    /** "Rapid-revisit" is the revisit rate (*tần suất chụp lặp lại*), never *quay lại nhanh* ("turns back fast") */
    blacksky: 'Máy chụp của BlackSky với tần suất chụp lặp lại cao, điểm ảnh khoảng 1 m hoặc nét hơn.',
    pleiades: 'Máy chụp linh hoạt, cho sản phẩm toàn sắc 50 cm.',
    pleiadesNeo: 'Máy chụp linh hoạt với điểm ảnh gốc 30 cm.',
    spot6: 'Máy chụp diện rộng với điểm ảnh toàn sắc 1,5 m và dải quét 60 km.',
    spot7: 'Vệ tinh song sinh của SPOT 6, do Azerbaijan vận hành với tên Azersky.',
    kompsat3: 'Máy chụp của Hàn Quốc với điểm ảnh toàn sắc 70 cm.',
    kompsat3a: 'Máy chụp của Hàn Quốc với điểm ảnh toàn sắc 55 cm và một kênh hồng ngoại.',
    /** "Sub-metre imagers" is their pixel, not their size: *máy chụp có điểm ảnh dưới 1 m* */
    jilin1: 'Thuộc chòm vệ tinh thương mại Jilin-1 của Trung Quốc, với máy chụp có điểm ảnh dưới 1 m.',
    superview: 'Máy chụp thương mại của Trung Quốc, điểm ảnh khoảng 50 cm hoặc nét hơn.',
    gaofenWideField: 'Máy chụp của chính phủ Trung Quốc, mang camera toàn sắc 2 m và camera góc rộng 16 m.',
    gaofen2: 'Máy chụp của chính phủ Trung Quốc với điểm ảnh toàn sắc 80 cm.',
    gaofen7: 'Máy chụp lập thể của chính phủ Trung Quốc, dùng để đo vẽ bản đồ, điểm ảnh dưới 1 m.',
    gaofenOptical: 'Vệ tinh quang học độ phân giải cao của chính phủ Trung Quốc; thông số không được công bố.',

    // ── Radar satellites ──
    sentinel1: 'Radar băng C của Copernicus, công bố mọi bức ảnh: dải quét 250 km chếch sang một bên, độ phân giải 20 m, xuyên mây, cả ngày lẫn đêm.',
    /** Radar *ghi ảnh*, never *chụp* (vi.md §0) */
    iceye: 'Vệ tinh radar băng X cỡ nhỏ, có thể được điều khiển để ghi ảnh xuyên mây, cả ngày lẫn đêm.',
    capella: 'Vệ tinh radar băng X với ảnh spotlight khoảng 50 cm, cả ngày lẫn đêm.',
    umbra: 'Vệ tinh radar băng X với ảnh spotlight chi tiết tới khoảng 25 cm.',
    japaneseSmallRadar: 'Vệ tinh radar băng X cỡ nhỏ của Nhật Bản.',
    kompsat5: 'Vệ tinh radar băng X của Hàn Quốc, ảnh spotlight 1 m.',
    terrasarX: 'Vệ tinh radar băng X của Đức, ghi ảnh từ năm 2007.',
    tandemX: 'Bay theo đội hình sát cạnh TerraSAR-X để lập bản đồ địa hình Trái Đất bằng radar.',
    cosmoSkymed: 'Vệ tinh radar băng X của Italy, thuộc hệ thống COSMO-SkyMed.',
    paz: 'Vệ tinh radar băng X của Tây Ban Nha.',
    radarsat2: 'Vệ tinh radar băng C của Canada, ghi ảnh từ năm 2007.',
    rcm: 'Một trong ba vệ tinh thuộc RADARSAT Constellation Mission của Canada.',
    saocom: 'Vệ tinh radar băng L của Argentina, còn đo cả độ ẩm đất.',
    alos2: 'Vệ tinh radar băng L của Nhật Bản, ghi ảnh từ năm 2014.',
    alos4: 'Vệ tinh radar băng L của Nhật Bản, kế nhiệm ALOS-2.',
    nisar: 'Radar hai băng tần, lập bản đồ dải quét 242 km để đo chuyển động của mặt đất.',
    superviewNeo2: 'Vệ tinh radar băng X thương mại của Trung Quốc.',
    gaofen3: 'Vệ tinh radar băng C của chính phủ Trung Quốc.',
    gaofen12: 'Vệ tinh radar của chính phủ Trung Quốc; thông số không được công bố.',

    // ── Crewed space stations ──
    iss: 'Trạm Vũ trụ Quốc tế, có người ở liên tục từ tháng\u00a011 năm\u00a02000.',
    tiangong: 'Trạm vũ trụ của Trung Quốc, xây quanh mô-đun lõi Tianhe phóng năm 2021.',
  },
}
export default sats
