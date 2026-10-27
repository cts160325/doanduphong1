const mongoose = require("mongoose");
const connect = require("./models/connect.js");
const LoaiNoiThat = require("./models/loainoithat.js");
const NoiThat = require("./models/noithat.js");
const HeThong = require("./models/hethong.js");

async function seedData() {
  await connect();
  
  console.log("Xóa dữ liệu cũ...");
  await LoaiNoiThat.deleteMany({});
  await NoiThat.deleteMany({});
  await HeThong.deleteMany({});

  console.log("Khởi tạo cấu hình hệ thống...");
  await HeThong.insertMany([
    { key: "site_name", value: "Nội thất SSC", description: "Tên thương hiệu trên website" },
    { key: "site_logo_text", value: "SSC", description: "Tên logo viết tắt" },
    { key: "site_phone", value: "0337534263", description: "Số điện thoại hotline" },
    { key: "site_email_support", value: "support@noithatssc.vn", description: "Email hỗ trợ khách hàng" },
    { key: "site_email_partner", value: "partner@noithatssc.vn", description: "Email hợp tác" },
    { key: "site_address_cs1", value: "Cầu Giấy - Hà Nội", description: "Địa chỉ cơ sở 1" },
    { key: "site_address_cs2", value: "Ngã tư sở - Hà Nội", description: "Địa chỉ cơ sở 2" },
    { key: "site_address_cs3", value: "Chợ Phùng Khoang - Hà Nội", description: "Địa chỉ cơ sở 3" },
    { key: "hero_banner_url", value: "/images/ghesofaday.jpg", description: "Ảnh bìa trang chủ" },
    { key: "hero_title", value: "Nâng tầm không gian sống", description: "Tiêu đề trang chủ" },
    { key: "hero_subtitle", value: "Bộ sưu tập nội thất cao cấp 2026 đã sẵn sàng phục vụ bạn.", description: "Phụ đề trang chủ" },
    { key: "site_logo_url", value: "/images/logo.png", description: "Đường dẫn ảnh Logo" }
  ]);

  console.log("Thêm danh mục nội thất...");
  await LoaiNoiThat.insertMany([
    { mLoaiNoiThat: "NT01", tenLoai: "Phòng khách" },
    { mLoaiNoiThat: "NT02", tenLoai: "Phòng ngủ" },
    { mLoaiNoiThat: "NT03", tenLoai: "Phòng ăn & Bếp" },
    { mLoaiNoiThat: "NT04", tenLoai: "Văn phòng" },
    { mLoaiNoiThat: "NT05", tenLoai: "Trang trí" }
  ]);

  const dsNoiThat = [
    { 
      mNoiThat: "SP01", 
      tenNoiThat: "Ghế Sofa Da Ý Cao Cấp", 
      gia: 15000000, 
      donViTinh: "bộ", 
      xuatXu: "Ý", 
      loaiNoiThat: "Phòng khách", 
      hinhAnh: "/images/ghesofaday.jpg", 
      moTa: `◆ Sofa nhập khẩu nguyên bộ:
- Mã sofa: SP01
- Chất liệu: Da bò thật 100% nhập khẩu từ Ý.
- Màu sắc: Nâu cafe sang trọng.

Dấu ấn đặc trưng:
- Mẫu sofa được lên thiết kế từ Ý - Kiểu dáng tối giản, hiện đại.
- Da bò đực 3 năm tuổi, bề mặt mịn, độ bền cực cao.
- Nhập khẩu trực tiếp, đạt chuẩn quốc tế CO & CQ.

Ưu điểm vượt trội:
- Đệm mút Inoac Nhật Bản chống xẹp lún, đàn hồi êm ái.
- Khung gỗ sồi tự nhiên đã qua xử lý chống mối mọt.

Bảo hành:
- Khung sofa: 12 năm.
- Đệm ngồi: 3 năm.
- Bề mặt da: 24 tháng.`
    },
    { 
      mNoiThat: "SP02", 
      tenNoiThat: "Bàn Trà Gỗ Sồi", 
      gia: 3500000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng khách", 
      hinhAnh: "/images/bantragosoi.jpg", 
      moTa: `◆ Bàn trà phong cách Bắc Âu:
- Mã sản phẩm: SP02
- Chất liệu: Gỗ sồi Nga tự nhiên 100%.

Dấu ấn đặc trưng:
- Vân gỗ tự nhiên sắc nét, sơn phủ PU 5 lớp chống thấm nước.
- Sản xuất tại xưởng Nội thất SSC theo tiêu chuẩn xuất khẩu.

Ưu điểm vượt trội:
- Thiết kế bo góc an toàn cho gia đình có trẻ nhỏ.
- Chân bàn chắc chắn, chịu lực lên đến 100kg.

Bảo hành:
- Phần gỗ: 5 năm.
- Nước sơn: 2 năm.`
    },
    { 
      mNoiThat: "SP03", 
      tenNoiThat: "Giường Ngủ King Size", 
      gia: 8500000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/giuongngukingsize.jpg", 
      moTa: `◆ Giường ngủ hiện đại King Size:
- Mã sản phẩm: SP03
- Kích thước: 1m8 x 2m.
- Chất liệu: Gỗ công nghiệp MDF lõi xanh chống ẩm phủ Melamine.

Dấu ấn đặc trưng:
- Thiết kế giường bệt phong cách Nhật Bản tối ưu không gian.
- Màu sắc: Vân gỗ sáng kết hợp trắng tinh tế.

Ưu điểm vượt trội:
- Khung giường gia cố chắc chắn, không phát ra tiếng động khi sử dụng.
- Bề mặt chống trầy xước, dễ dàng vệ sinh.

Bảo hành:
- Kỹ thuật: 3 năm.`
    },
    { 
      mNoiThat: "SP04", 
      tenNoiThat: "Tủ Quần Áo 4 Cánh", 
      gia: 12000000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/Tuquanao4Canh.jpg", 
      moTa: `◆ Tủ quần áo kịch trần:
- Mã sản phẩm: SP04
- Chất liệu: MDF phủ Acrylic bóng gương cực sang trọng.

Dấu ấn đặc trưng:
- Thiết kế 4 cánh mở kết hợp ngăn kéo tiện dụng.
- Phụ kiện bản lề giảm chấn, ray trượt êm ái.

Ưu điểm vượt trội:
- Sức chứa cực lớn, phân chia ngăn khoa học.
- Chống ẩm mốc, cong vênh tuyệt đối.

Bảo hành:
- Phụ kiện: 2 năm.
- Gỗ: 5 năm.`
    },
    { 
      mNoiThat: "SP05", 
      tenNoiThat: "Bộ Bàn Ăn 6 Ghế", 
      gia: 9500000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ăn & Bếp", 
      hinhAnh: "/images/bobanan6Ghe.jpg", 
      moTa: `◆ Bộ bàn ăn gỗ tự nhiên:
- Mã sản phẩm: SP05
- Bao gồm: 1 bàn dài 1m6 + 6 ghế bọc nệm.
- Chất liệu: Gỗ cao su tự nhiên đã qua tẩm sấy.

Dấu ấn đặc trưng:
- Ghế bọc nệm da Simili cao cấp, dễ lau chùi.
- Thiết kế hiện đại, phù hợp cho căn hộ chung cư.

Ưu điểm vượt trội:
- Mặt bàn đá nhân tạo chống thấm, chịu nhiệt tốt.
- Kết cấu lắp ráp thông minh, dễ vận chuyển.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP06", 
      tenNoiThat: "Ghế Công Thái Học", 
      gia: 4500000, 
      donViTinh: "chiếc", 
      xuatXu: "Trung Quốc", 
      loaiNoiThat: "Văn phòng", 
      hinhAnh: "/images/Ghecongtháihoc.jpg", 
      moTa: `◆ Ghế văn phòng Ergonomic:
- Mã sản phẩm: SP06
- Chất liệu: Lưới chịu lực thoáng khí, khung nhựa ABS nguyên sinh.

Dấu ấn đặc trưng:
- Hỗ trợ cột sống thắt lưng đa điểm.
- Tựa đầu tùy chỉnh cao thấp, xoay góc.

Ưu điểm vượt trội:
- Piston Class 4 chịu tải lên đến 150kg.
- Giúp giảm đau mỏi lưng khi làm việc liên tục 8-10 tiếng.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP07", 
      tenNoiThat: "Đèn Thả Trần Kim Cương", 
      gia: 1200000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Trang trí", 
      hinhAnh: "/images/denthatrankimcuong.jpg", 
      moTa: `◆ Đèn decor phong cách hiện đại:
- Mã sản phẩm: SP07
- Chất liệu: Khung sắt sơn tĩnh điện mạ vàng.

Dấu ấn đặc trưng:
- Hình dáng kim cương độc đáo, tạo hiệu ứng ánh sáng lung linh.
- Phù hợp trang trí phòng khách hoặc bàn ăn.

Ưu điểm vượt trội:
- Sử dụng bóng LED tiết kiệm điện, tuổi thọ 20.000 giờ.
- Dễ dàng lắp đặt và vệ sinh.

Bảo hành: 6 tháng.`
    },
    { 
      mNoiThat: "SP08", 
      tenNoiThat: "Kệ Sách Gỗ Treo Tường", 
      gia: 850000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Văn phòng", 
      hinhAnh: "/images/kesachgotreotuong.jpg", 
      moTa: `◆ Kệ sách tối ưu không gian:
- Mã sản phẩm: SP08
- Chất liệu: Gỗ thông tự nhiên.

Dấu ấn đặc trưng:
- Thiết kế giấu chân kệ, tạo cảm giác lơ lửng trên tường.
- Sản xuất handmade, hoàn thiện tỉ mỉ.

Ưu điểm vượt trội:
- Chịu lực tốt (tới 15kg/kệ).
- Mang lại vẻ đẹp mộc mạc cho góc làm việc.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP09", 
      tenNoiThat: "Kệ Tivi Gỗ Công Nghiệp", 
      gia: 2500000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng khách", 
      hinhAnh: "/images/ketivigocongnghiep.jpg", 
      moTa: `◆ Kệ tivi hiện đại:
- Mã sản phẩm: SP09
- Chất liệu: MDF chống ẩm.

Dấu ấn đặc trưng:
- Thiết kế rút gọn chiều dài linh hoạt từ 1m6 đến 2m.
- Màu sắc trắng sứ kết hợp vân gỗ sồi.

Ưu điểm vượt trội:
- Nhiều ngăn kéo chứa đồ tiện dụng, ray trượt giảm chấn.
- Bề mặt chống thấm nước, chống ố vàng.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP10", 
      tenNoiThat: "Ghế Bành Thư Giãn", 
      gia: 4200000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng khách", 
      hinhAnh: "/images/ghebanhthugian.jpg", 
      moTa: `◆ Ghế thư giãn cao cấp:
- Mã sản phẩm: SP10
- Chất liệu: Vải nỉ nhung mềm mại, chân gỗ sồi.

Dấu ấn đặc trưng:
- Đi kèm đôn kê chân cùng màu.
- Tựa lưng thiết kế ôm sát cơ thể, nâng đỡ cột sống.

Ưu điểm vượt trội:
- Đệm mút D40 siêu đàn hồi, không lún xẹp.
- Vải bọc thoáng khí, không gây bí bách khi ngồi lâu.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP11", 
      tenNoiThat: "Bàn Trang Điểm Hiện Đại", 
      gia: 3800000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/bantrangdiemhiendai.jpg", 
      moTa: `◆ Bàn trang điểm decor:
- Mã sản phẩm: SP11
- Chất liệu: Gỗ MDF cao cấp.

Dấu ấn đặc trưng:
- Gương tròn tích hợp đèn LED cảm ứng 3 chế độ màu.
- Ngăn kéo chia ô đựng mỹ phẩm khoa học.

Ưu điểm vượt trội:
- Chân bàn inox mạ vàng sang trọng.
- Đi kèm ghế nệm êm ái phong cách hoàng gia.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP12", 
      tenNoiThat: "Tủ Đầu Giường 2 Ngăn", 
      gia: 1200000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/tudaugiuong2ngan.jpg", 
      moTa: `◆ Tab đầu giường tiện lợi:
- Mã sản phẩm: SP12
- Chất liệu: Gỗ MDF phủ Melamine.

Dấu ấn đặc trưng:
- Kích thước nhỏ gọn 40x40cm, phù hợp mọi không gian.
- Màu sắc trang nhã, dễ phối hợp with các mẫu giường hiện đại.

Ưu điểm vượt trội:
- Ray kéo ngăn kéo trơn tru, bền bỉ.
- Bề mặt chống ẩm tốt, dễ vệ sinh.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP13", 
      tenNoiThat: "Nệm Cao Su Thiên Nhiên", 
      gia: 12500000, 
      donViTinh: "tấm", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/nemcaosuthiennhien.jpg", 
      moTa: `◆ Nệm ngủ bảo vệ sức khỏe:
- Mã sản phẩm: SP13
- Chất liệu: 100% cao su thiên nhiên nguyên chất.

Dấu ấn đặc trưng:
- Cấu trúc hàng nghìn lỗ thông hơi li ti, mát mẻ cả mùa hè.
- Kháng khuẩn, chống nấm mốc tự nhiên.

Ưu điểm vượt trội:
- Độ đàn hồi hoàn hảo, nâng đỡ 7 vùng cơ thể.
- Độ bền lên đến 20 năm, không bị xẹp lún theo thời gian.

Bảo hành: 10 năm.`
    },
    { 
      mNoiThat: "SP14", 
      tenNoiThat: "Tủ Bếp Module Thông Minh", 
      gia: 18000000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ăn & Bếp", 
      hinhAnh: "/images/tubepmodulethongminh.jpg", 
      moTa: `◆ Hệ tủ bếp module hiện đại:
- Mã sản phẩm: SP14
- Chất liệu: Nhựa Picomat chống nước tuyệt đối hoặc MDF lõi xanh.

Dấu ấn đặc trưng:
- Thiết kế module linh hoạt, lắp đặt nhanh chóng.
- Cánh tủ phủ Laminate chống trầy xước và chịu nhiệt.

Ưu điểm vượt trội:
- Tích hợp các khoang phụ kiện thông minh (giá bát di động, kệ gia vị).
- Không lo ẩm mốc, mối mọt, an toàn tuyệt đối cho thực phẩm.

Bảo hành: 5 năm.`
    },
    { 
      mNoiThat: "SP15", 
      tenNoiThat: "Ghế Bar Chân Sắt", 
      gia: 1100000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ăn & Bếp", 
      hinhAnh: "/images/ghebarchansat.jpg", 
      moTa: `◆ Ghế quầy bar phong cách Loft:
- Mã sản phẩm: SP15
- Chất liệu: Khung sắt sơn tĩnh điện, mặt gỗ sồi.

Dấu ấn đặc trưng:
- Kiểu dáng Industrial mạnh mẽ, cá tính.
- Độ cao phù hợp cho quầy bar chung cư hoặc quán cafe.

Ưu điểm vượt trội:
- Chịu lực cực tốt, độ bền cao.
- Thiết kế có chỗ để chân thoải mái.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP16", 
      tenNoiThat: "Bàn Làm Việc Chân Chữ U", 
      gia: 1850000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Văn phòng", 
      hinhAnh: "/images/banlamviecchanchuu.jpg", 
      moTa: `◆ Bàn làm việc tối giản:
- Mã sản phẩm: SP16
- Chất liệu: Gỗ công nghiệp MDF phủ Melamine, khung sắt.

Dấu ấn đặc trưng:
- Chân chữ U sơn tĩnh điện sang trọng, chắc chắn.
- Mặt bàn rộng 1m2, đủ không gian cho máy tính và tài liệu.

Ưu điểm vượt trội:
- Lắp ráp cực dễ dàng chỉ trong 5 phút.
- Chân bàn có nút tăng chỉnh chống khập khiễng trên sàn không phẳng.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP17", 
      tenNoiThat: "Tủ Hồ Sơ Di Động", 
      gia: 1450000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Văn phòng", 
      hinhAnh: "/images/tuhosodidong.jpg", 
      moTa: `◆ Tủ tài liệu cá nhân:
- Mã sản phẩm: SP17
- Chất liệu: Gỗ MDF cao cấp.

Dấu ấn đặc trưng:
- Hệ thống bánh xe xoay 360 độ có khóa.
- 3 ngăn kéo rộng rãi, tích hợp khóa trung tâm bảo mật.

Ưu điểm vượt trội:
- Thiết kế nhỏ gọn, lọt gầm bàn giúp tiết kiệm không gian.
- Ray trượt bi 3 tầng giúp kéo mở hết hành trình ngăn kéo.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP18", 
      tenNoiThat: "Gương Đứng Khung Gỗ", 
      gia: 1600000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Trang trí", 
      hinhAnh: "/images/guongdungkhunggo.jpg", 
      moTa: `◆ Gương soi toàn thân:
- Mã sản phẩm: SP18
- Chất liệu: Khung gỗ sồi tự nhiên, gương Bỉ nhập khẩu.

Dấu ấn đặc trưng:
- Hình ảnh chân thực, sắc nét, chống mốc, chống ố.
- Khung gỗ bo tròn mềm mại, phong cách nghệ thuật.

Ưu điểm vượt trội:
- Giúp mở rộng thị giác cho căn phòng nhỏ.
- Có thể treo tường hoặc dựa tường linh hoạt.

Bảo hành: Gương 5 năm, khung 2 năm.`
    },
    { 
      mNoiThat: "SP19", 
      tenNoiThat: "Thảm Trải Sàn Lông Cừu", 
      gia: 2800000, 
      donViTinh: "tấm", 
      xuatXu: "Thổ Nhĩ Kỳ", 
      loaiNoiThat: "Trang trí", 
      hinhAnh: "/images/thamtraisanlongcuu.jpg", 
      moTa: `◆ Thảm dệt tay cao cấp:
- Mã sản phẩm: SP19
- Chất liệu: Lông cừu tự nhiên kết hợp sợi tổng hợp.

Dấu ấn đặc trưng:
- Họa tiết tinh xảo, mang đậm nét văn hóa Thổ Nhĩ Kỳ.
- Màu sắc bền bỉ theo thời gian, không phai màu khi giặt.

Ưu điểm vượt trội:
- Khả năng giữ nhiệt tốt, mang lại sự ấm áp cho mùa đông.
- Chống trơn trượt tuyệt đối với lớp lót cao su phía dưới.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP20", 
      tenNoiThat: "Tranh Treo Tường Trừu Tượng", 
      gia: 950000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Trang trí", 
      hinhAnh: "/images/tranhtreotuongtruutuong.jpg", 
      moTa: `◆ Bộ tranh nghệ thuật Canvas:
- Mã sản phẩm: SP20
- Chất liệu: Vải Canvas kim dệt độ phân giải cao, khung composite.

Dấu ấn đặc trưng:
- Bộ 3 bức tranh chủ đề tối giản, màu sắc trung tính.
- Phù hợp tạo điểm nhấn cho mảng tường trống phòng khách.

Ưu điểm vượt trội:
- Tranh có khả năng chống ẩm, chống nước, lau chùi được bằng khăn ướt.
- Trọng lượng nhẹ, dễ dàng treo bằng đinh 3 chân không cần khoan tường.

Bảo hành: 12 tháng màu sắc.`
    },
    { 
      mNoiThat: "SP21", 
      tenNoiThat: "Sofa Da Ý Nhập Khẩu", 
      gia: 65000000, 
      donViTinh: "bộ", 
      xuatXu: "Ý (Italy)", 
      loaiNoiThat: "Phòng khách", 
      hinhAnh: "/images/ghesofaday.jpg", 
      tonKho: 5,
      moTa: `◆ Sofa Da Ý Cao Cấp:
- Mã sản phẩm: SP21
- Chất liệu: Da bò thật 100% nhập khẩu từ Ý, khung gỗ sồi Nga.
- Kích thước: 3m2 x 1m8.

Dấu ấn đặc trưng:
- Thiết kế tân cổ điển sang trọng, từng đường kim mũi chỉ tinh xảo.
- Đệm mút K43 Việt Nhật êm ái, chống xẹp lún.

Ưu điểm vượt trội:
- Càng dùng da càng bóng và mềm mịn.
- Khẳng định vị thế và đẳng cấp của gia chủ.

Bảo hành: 10 năm khung, 5 năm bề mặt da.`
    },
    { 
      mNoiThat: "SP22", 
      tenNoiThat: "Giường Tầng Trẻ Em Thông Minh", 
      gia: 8500000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ngủ", 
      hinhAnh: "/images/giuongtangtreemthongminh.jpg", 
      tonKho: 15,
      moTa: `◆ Giường tầng gỗ tự nhiên cho bé:
- Mã sản phẩm: SP22
- Kích thước: Dài 2m x Rộng 1m2/1m.
- Chất liệu: Gỗ thông nhập khẩu, sơn Inchem an toàn.

Dấu ấn đặc trưng:
- Tích hợp cầu thang hộc chứa đồ tiện lợi.
- Thiết kế bo tròn các góc, đảm bảo an toàn tuyệt đối cho trẻ.

Ưu điểm vượt trội:
- Tiết kiệm tối đa diện tích cho phòng ngủ nhỏ.
- Khung giường chắc chắn, chịu lực lên đến 200kg mỗi tầng.

Bảo hành: 3 năm.`
    },
    { 
      mNoiThat: "SP23", 
      tenNoiThat: "Kệ Chén Bát Đa Năng", 
      gia: 1650000, 
      donViTinh: "bộ", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Phòng ăn & Bếp", 
      hinhAnh: "/images/kechenbatdanang.jpg", 
      tonKho: 25,
      moTa: `◆ Hệ kệ nhà bếp thông minh:
- Mã sản phẩm: SP23
- Chất liệu: Inox 304 sơn tĩnh điện đen cao cấp, chống gỉ sét.
- Kích thước: Rộng 85cm (phù hợp bồn rửa đôi).

Dấu ấn đặc trưng:
- Thiết kế đa năng: kệ bát, kệ đĩa, ống cắm dao, khay để thớt.
- Giúp gian bếp luôn gọn gàng, khô ráo.

Ưu điểm vượt trội:
- Chịu lực tới 50kg, không rung lắc.
- Dễ dàng tháo rời để vệ sinh định kỳ.

Bảo hành: 2 năm.`
    },
    { 
      mNoiThat: "SP24", 
      tenNoiThat: "Bàn Làm Việc Chữ L", 
      gia: 2250000, 
      donViTinh: "cái", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Văn phòng", 
      hinhAnh: "/images/banlamviecchuL.jpg", 
      tonKho: 20,
      moTa: `◆ Bàn làm việc góc tường:
- Mã sản phẩm: SP24
- Chất liệu: Gỗ MDF phủ Melamine chống trầy, khung sắt sơn tĩnh điện.
- Kích thước: 1m4 x 1m2.

Dấu ấn đặc trưng:
- Thiết kế chữ L giúp tối ưu không gian góc phòng.
- Mặt bàn rộng rãi, đủ chỗ cho 2 màn hình lớn.

Ưu điểm vượt trội:
- Kết cấu khung sắt chắc chắn, không rung lắc khi gõ phím.
- Màu sắc vân gỗ tối giản, hiện đại.

Bảo hành: 12 tháng.`
    },
    { 
      mNoiThat: "SP25", 
      tenNoiThat: "Đèn Cây Đứng Hiện Đại", 
      gia: 1450000, 
      donViTinh: "chiếc", 
      xuatXu: "Việt Nam", 
      loaiNoiThat: "Trang trí", 
      hinhAnh: "/images/dencaydunghiendai.jpg", 
      tonKho: 30,
      moTa: `◆ Đèn decor phong cách Bắc Âu:
- Mã sản phẩm: SP25
- Chất liệu: Thân gỗ sồi, chao đèn vải lanh cao cấp.
- Chiều cao: 1m6.

Dấu ấn đặc trưng:
- Ánh sáng vàng ấm, tạo không gian thư giãn.
- Thiết kế tối giản, phù hợp làm điểm nhấn cho phòng khách.

Ưu điểm vượt trội:
- Chân đế vững chãi, không lo đổ ngã.
- Sử dụng bóng LED tiết kiệm điện, tuổi thọ cao.

Bảo hành: 12 tháng.`
    }
  ];

  console.log("Thêm sản phẩm nội thất...");
  await NoiThat.insertMany(dsNoiThat);

  console.log("Thêm dữ liệu mẫu thành công!");
  process.exit();
}

seedData().catch(err => {
  console.log(err);
  process.exit(1);
});
