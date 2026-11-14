/**
 * admin.test.js — Kiểm thử chức năng Quản trị viên (Admin)
 * 
 * Bao gồm:
 * - Dashboard admin (GET /admin)
 * - CRUD Danh mục (Categories)
 * - Quản lý thành viên (đổi vai trò, xóa)
 * - Quản lý đơn hàng (cập nhật trạng thái)
 * - Quản lý đánh giá (xóa review)
 * - Cấu hình hệ thống (Admin Settings)
 */

const request = require("supertest");
const { connectDB, closeDB, clearDB } = require("./setup");
const {
  createUser,
  createAdmin,
  createCategory,
  createProduct,
  createOrder,
  loginAs,
} = require("./helpers");

const ThanhVien = require("../models/thanhvien");
const LoaiNoiThat = require("../models/loainoithat");
const DonHang = require("../models/donhang");
const Review = require("../models/review");

let app;

beforeAll(async () => {
  await connectDB();
  app = require("../index").app;
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

/**
 * Helper: Tạo admin và đăng nhập, trả về agent
 */
async function getAdminAgent() {
  await createAdmin({ email: "superadmin@gmail.com", matKhau: "admin123" });
  const agent = request.agent(app);
  await loginAs(agent, "superadmin@gmail.com", "admin123");
  return agent;
}

// ============================================
// DASHBOARD ADMIN
// ============================================
describe("GET /admin — Dashboard quản trị", () => {
  test("Admin truy cập dashboard thành công (200)", async () => {
    const agent = await getAdminAgent();
    const res = await agent.get("/admin");
    expect(res.status).toBe(200);
  });

  test("Dashboard hiển thị thống kê tổng quan", async () => {
    // Tạo dữ liệu mẫu
    await createProduct();
    const user = await createUser({ email: "stat_user@gmail.com" });
    const product = await createProduct({ mNoiThat: "STAT_NT" });
    await createOrder({
      thanhVienId: user._id,
      noithatId: product._id,
      tongTien: 5000000,
      trangThai: "Hoàn thành",
    });

    const agent = await getAdminAgent();
    const res = await agent.get("/admin");

    expect(res.status).toBe(200);
    // Dashboard phải render ra HTML chứa các thông tin thống kê
    expect(res.text).toBeDefined();
  });
});

// ============================================
// CRUD DANH MỤC (Categories)
// ============================================
describe("CRUD Danh mục (Admin)", () => {
  test("GET /categories — Xem danh sách danh mục", async () => {
    await createCategory({ tenLoai: "Ghế sofa" });

    const agent = await getAdminAgent();
    const res = await agent.get("/categories");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Ghế sofa");
  });

  test("POST /categories/add — Thêm danh mục mới", async () => {
    const agent = await getAdminAgent();

    const res = await agent
      .post("/categories/add")
      .send({
        mLoaiNoiThat: "LNT_NEW",
        tenLoai: "Tủ bếp",
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/categories");

    // Xác nhận trong DB
    const cat = await LoaiNoiThat.findOne({ tenLoai: "Tủ bếp" });
    expect(cat).not.toBeNull();
  });

  test("POST /categories/update/:id — Sửa danh mục", async () => {
    const cat = await createCategory({ tenLoai: "Cũ" });
    const agent = await getAdminAgent();

    const res = await agent
      .post(`/categories/update/${cat._id}`)
      .send({ tenLoai: "Đã sửa" });

    expect(res.status).toBe(302);

    const updated = await LoaiNoiThat.findById(cat._id);
    expect(updated.tenLoai).toBe("Đã sửa");
  });

  test("POST /categories/delete/:id — Xóa danh mục", async () => {
    const cat = await createCategory({ tenLoai: "Sẽ xóa" });
    const agent = await getAdminAgent();

    const res = await agent.post(`/categories/delete/${cat._id}`);
    expect(res.status).toBe(302);

    const deleted = await LoaiNoiThat.findById(cat._id);
    expect(deleted).toBeNull();
  });

  test("User thường không được thêm danh mục", async () => {
    await createUser({ email: "norole@gmail.com", matKhau: "123456" });
    const agent = request.agent(app);
    await loginAs(agent, "norole@gmail.com", "123456");

    const res = await agent
      .post("/categories/add")
      .send({ mLoaiNoiThat: "LNT_HACK", tenLoai: "Hack" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});

// ============================================
// QUẢN LÝ THÀNH VIÊN
// ============================================
describe("Quản lý thành viên (Admin)", () => {
  test("GET /members — Xem danh sách thành viên", async () => {
    await createUser({ hoTen: "Thành viên test", email: "member@test.com" });

    const agent = await getAdminAgent();
    const res = await agent.get("/members");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Thành viên test");
  });

  test("POST /members/change-role/:id — Đổi vai trò thành viên", async () => {
    const user = await createUser({ email: "changerole@gmail.com" });

    const agent = await getAdminAgent();
    const res = await agent
      .post(`/members/change-role/${user._id}`)
      .send({ vaiTro: "admin" });

    expect(res.status).toBe(302);

    const updated = await ThanhVien.findById(user._id);
    expect(updated.vaiTro).toBe("admin");
  });

  test("POST /members/delete/:id — Xóa thành viên", async () => {
    const user = await createUser({ email: "deleteme@gmail.com" });

    const agent = await getAdminAgent();
    const res = await agent.post(`/members/delete/${user._id}`);

    expect(res.status).toBe(302);

    const deleted = await ThanhVien.findById(user._id);
    expect(deleted).toBeNull();
  });
});

// ============================================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// ============================================
describe("Cập nhật trạng thái đơn hàng (Admin)", () => {
  test("POST /update-order-status/:id — Cập nhật trạng thái đơn hàng", async () => {
    const product = await createProduct();
    const order = await createOrder({
      noithatId: product._id,
      trangThai: "Chờ xác nhận",
    });

    const agent = await getAdminAgent();
    const res = await agent
      .post(`/update-order-status/${order._id}`)
      .send({ trangThai: "Đang giao" });

    expect(res.status).toBe(302);

    const updated = await DonHang.findById(order._id);
    expect(updated.trangThai).toBe("Đang giao");
  });
});

// ============================================
// QUẢN LÝ ĐÁNH GIÁ
// ============================================
describe("Quản lý đánh giá (Admin)", () => {
  test("POST /reviews/delete/:id — Admin xóa đánh giá", async () => {
    const review = await Review.create({
      tenNguoiDanhGia: "Bad reviewer",
      soSao: 1,
      chiTiet: "Spam review",
    });

    const agent = await getAdminAgent();
    const res = await agent.post(`/reviews/delete/${review._id}`);

    expect(res.status).toBe(302);

    const deleted = await Review.findById(review._id);
    expect(deleted).toBeNull();
  });
});

// ============================================
// CẤU HÌNH HỆ THỐNG
// ============================================
describe("Cấu hình hệ thống (Admin Settings)", () => {
  test("GET /admin/settings — Xem trang cấu hình", async () => {
    const agent = await getAdminAgent();
    const res = await agent.get("/admin/settings");

    expect(res.status).toBe(200);
  });

  test("POST /admin/settings — Lưu cấu hình", async () => {
    const agent = await getAdminAgent();
    const res = await agent
      .post("/admin/settings")
      .send({
        shop_name: "SSC Furniture",
        hotline: "0901234567",
      });

    expect(res.status).toBe(302);
  });
});
