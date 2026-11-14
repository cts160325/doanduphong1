/**
 * models.test.js — Kiểm thử Unit cho Mongoose Models (Validation)
 * 
 * Kiểm tra các ràng buộc và validation rules được định nghĩa
 * trong từng schema Mongoose: required, min, max, enum, match, regex.
 */

const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup");

// Import models
const ThanhVien = require("../models/thanhvien");
const NoiThat = require("../models/noithat");
const LoaiNoiThat = require("../models/loainoithat");
const DonHang = require("../models/donhang");
const Review = require("../models/review");
const HeThong = require("../models/hethong");
const ThongBao = require("../models/thongbao");
const TuVan = require("../models/tuvan");
const TraHang = require("../models/traHang");

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

// ============================================
// MODEL: ThanhVien (Thành viên)
// ============================================
describe("Model ThanhVien — Validation", () => {
  test("Tạo thành viên thành công với dữ liệu hợp lệ", async () => {
    const user = await ThanhVien.create({
      hoTen: "Nguyen Van A",
      email: "valid@gmail.com",
      matKhau: "hashedpassword123",
      soDT: "0901234567",
      diaChi: "123 Nguyen Hue",
    });

    expect(user._id).toBeDefined();
    expect(user.hoTen).toBe("Nguyen Van A");
    expect(user.vaiTro).toBe("user"); // Default value
    expect(user.ngayDangKy).toBeDefined();
  });

  test("Thất bại khi thiếu hoTen (required)", async () => {
    await expect(
      ThanhVien.create({
        email: "noname@gmail.com",
        matKhau: "123456",
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi thiếu email (required)", async () => {
    await expect(
      ThanhVien.create({
        hoTen: "No Email",
        matKhau: "123456",
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi email trùng (unique)", async () => {
    await ThanhVien.create({
      hoTen: "User 1",
      email: "unique@gmail.com",
      matKhau: "123456",
    });

    await expect(
      ThanhVien.create({
        hoTen: "User 2",
        email: "unique@gmail.com",
        matKhau: "654321",
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi hoTen chứa ký tự HTML (match regex)", async () => {
    await expect(
      ThanhVien.create({
        hoTen: "<script>alert(1)</script>",
        email: "xss@gmail.com",
        matKhau: "123456",
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi soDT chứa ký tự không phải số (match regex)", async () => {
    await expect(
      ThanhVien.create({
        hoTen: "User Phone",
        email: "phone@gmail.com",
        matKhau: "123456",
        soDT: "abc12345",
      })
    ).rejects.toThrow();
  });
});

// ============================================
// MODEL: NoiThat (Sản phẩm nội thất)
// ============================================
describe("Model NoiThat — Validation", () => {
  test("Tạo sản phẩm thành công với dữ liệu hợp lệ", async () => {
    const product = await NoiThat.create({
      mNoiThat: "NT001",
      tenNoiThat: "Bàn gỗ sồi",
      gia: 3500000,
      donViTinh: "Cái",
      xuatXu: "Việt Nam",
      loaiNoiThat: "Bàn",
    });

    expect(product._id).toBeDefined();
    expect(product.tonKho).toBe(50); // Default value
    expect(product.moTa).toBe(""); // Default value
  });

  test("Thất bại khi thiếu mNoiThat (required)", async () => {
    await expect(
      NoiThat.create({
        tenNoiThat: "No Code",
        gia: 1000000,
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi giá <= 0 (min: 1)", async () => {
    await expect(
      NoiThat.create({
        mNoiThat: "NT_NEG",
        tenNoiThat: "Giá âm",
        gia: 0,
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi tồn kho âm (min: 0)", async () => {
    await expect(
      NoiThat.create({
        mNoiThat: "NT_STOCK",
        tenNoiThat: "Kho âm",
        gia: 1000000,
        tonKho: -5,
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi tenNoiThat chứa HTML", async () => {
    await expect(
      NoiThat.create({
        mNoiThat: "NT_XSS",
        tenNoiThat: "<b>XSS Product</b>",
        gia: 1000000,
      })
    ).rejects.toThrow();
  });
});

// ============================================
// MODEL: DonHang (Đơn hàng)
// ============================================
describe("Model DonHang — Validation", () => {
  test("Tạo đơn hàng thành công với dữ liệu hợp lệ", async () => {
    const product = await NoiThat.create({
      mNoiThat: "NT_ORDER",
      tenNoiThat: "Ghế văn phòng",
      gia: 2000000,
    });

    const order = await DonHang.create({
      noithatId: product._id,
      soLuong: 2,
      tongTien: 4000000,
    });

    expect(order._id).toBeDefined();
    expect(order.trangThai).toBe("Chờ xác nhận"); // Default value
    expect(order.giamGia).toBe(0); // Default value
    expect(order.ngayDat).toBeDefined();
  });

  test("Thất bại khi số lượng < 1 (min: 1)", async () => {
    const product = await NoiThat.create({
      mNoiThat: "NT_QTY",
      tenNoiThat: "Test Qty",
      gia: 100000,
    });

    await expect(
      DonHang.create({
        noithatId: product._id,
        soLuong: 0,
        tongTien: 0,
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi số lượng > 100 (max: 100)", async () => {
    const product = await NoiThat.create({
      mNoiThat: "NT_MAX",
      tenNoiThat: "Test Max",
      gia: 100000,
    });

    await expect(
      DonHang.create({
        noithatId: product._id,
        soLuong: 101,
        tongTien: 10100000,
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi trạng thái không nằm trong enum", async () => {
    const product = await NoiThat.create({
      mNoiThat: "NT_ENUM",
      tenNoiThat: "Test Enum",
      gia: 100000,
    });

    await expect(
      DonHang.create({
        noithatId: product._id,
        soLuong: 1,
        tongTien: 100000,
        trangThai: "Trạng thái không hợp lệ",
      })
    ).rejects.toThrow();
  });

  test("Tất cả trạng thái hợp lệ đều tạo được", async () => {
    const validStatuses = [
      "Chờ xác nhận", "Đang chuẩn bị hàng", "Đang giao",
      "Hoàn thành", "Đã hủy", "Yêu cầu hủy",
      "Yêu cầu trả hàng", "Đang trả hàng", "Đã hoàn tiền",
      "Giao không thành công",
    ];

    for (const status of validStatuses) {
      const product = await NoiThat.create({
        mNoiThat: `NT_S_${Date.now()}_${Math.random()}`,
        tenNoiThat: `Test ${status}`,
        gia: 100000,
      });

      const order = await DonHang.create({
        noithatId: product._id,
        soLuong: 1,
        tongTien: 100000,
        trangThai: status,
      });

      expect(order.trangThai).toBe(status);
    }
  });
});

// ============================================
// MODEL: Review (Đánh giá)
// ============================================
describe("Model Review — Validation", () => {
  test("Tạo review thành công", async () => {
    const review = await Review.create({
      tenNguoiDanhGia: "Khách hàng A",
      soSao: 4,
      mucDo: "Hài lòng",
      chiTiet: "Sản phẩm tốt",
    });

    expect(review._id).toBeDefined();
    expect(review.ngayTao).toBeDefined();
  });

  test("soSao mặc định là 5", async () => {
    const review = await Review.create({
      tenNguoiDanhGia: "Default Star",
    });
    expect(review.soSao).toBe(5);
  });

  test("Thất bại khi soSao < 1", async () => {
    await expect(
      Review.create({ soSao: 0 })
    ).rejects.toThrow();
  });

  test("Thất bại khi soSao > 5", async () => {
    await expect(
      Review.create({ soSao: 6 })
    ).rejects.toThrow();
  });
});

// ============================================
// MODEL: TuVan (Tư vấn / Liên hệ)
// ============================================
describe("Model TuVan — Validation", () => {
  test("Tạo yêu cầu tư vấn thành công", async () => {
    const tuvan = await TuVan.create({
      hoTen: "Nguyen Van X",
      soDT: "0901111111",
      email: "tuvan@test.com",
      noiDung: "Tôi muốn hỏi về sản phẩm bàn ăn",
    });

    expect(tuvan._id).toBeDefined();
    expect(tuvan.trangThai).toBe("Chưa xử lý"); // Default
  });

  test("Thất bại khi thiếu hoTen (required)", async () => {
    await expect(
      TuVan.create({
        soDT: "0901111111",
        email: "no@name.com",
        noiDung: "Test",
      })
    ).rejects.toThrow();
  });

  test("Thất bại khi thiếu noiDung (required)", async () => {
    await expect(
      TuVan.create({
        hoTen: "Test",
        soDT: "0901111111",
        email: "no@content.com",
      })
    ).rejects.toThrow();
  });

  test("Trạng thái chỉ nhận 'Chưa xử lý' hoặc 'Đã liên hệ'", async () => {
    await expect(
      TuVan.create({
        hoTen: "Enum Test",
        soDT: "0901111111",
        email: "enum@test.com",
        noiDung: "Test",
        trangThai: "Trạng thái lạ",
      })
    ).rejects.toThrow();
  });
});

// ============================================
// MODEL: HeThong (Cấu hình hệ thống)
// ============================================
describe("Model HeThong — Validation", () => {
  test("Tạo cấu hình hệ thống thành công", async () => {
    const setting = await HeThong.create({
      key: "shop_name",
      value: "Nội Thất SSC",
      description: "Tên cửa hàng",
    });

    expect(setting._id).toBeDefined();
    expect(setting.key).toBe("shop_name");
  });

  test("Thất bại khi key trùng (unique)", async () => {
    await HeThong.create({ key: "unique_key", value: "Value 1" });

    await expect(
      HeThong.create({ key: "unique_key", value: "Value 2" })
    ).rejects.toThrow();
  });

  test("Thất bại khi thiếu key hoặc value (required)", async () => {
    await expect(HeThong.create({ value: "No Key" })).rejects.toThrow();
    await expect(HeThong.create({ key: "no_value" })).rejects.toThrow();
  });
});
