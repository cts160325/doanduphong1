/**
 * helpers.js — Hàm tiện ích dùng chung giữa các file test.
 * 
 * Cung cấp các hàm tạo dữ liệu mẫu (fixtures) và đăng nhập nhanh
 * để tránh lặp code trong từng test file.
 */

const bcrypt = require("bcrypt");
const ThanhVien = require("../models/thanhvien");
const LoaiNoiThat = require("../models/loainoithat");
const NoiThat = require("../models/noithat");
const DonHang = require("../models/donhang");
const Review = require("../models/review");
const HeThong = require("../models/hethong");

/**
 * Tạo tài khoản user thường (đã hash mật khẩu).
 * @param {Object} overrides - Ghi đè các field mặc định
 * @returns {Object} Document user đã lưu vào DB
 */
async function createUser(overrides = {}) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(overrides.matKhau || "123456", salt);

  const userData = {
    hoTen: "Nguyễn Văn Test",
    email: `testuser_${Date.now()}@gmail.com`,
    matKhau: hashedPassword,
    soDT: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    diaChi: "123 Đường Test, Quận 1, TP.HCM",
    vaiTro: "user",
    ...overrides,
  };

  // Nếu có ghi đè mật khẩu thì hash lại
  if (overrides.matKhau) {
    userData.matKhau = await bcrypt.hash(overrides.matKhau, salt);
  }

  return await ThanhVien.create(userData);
}

/**
 * Tạo tài khoản admin (đã hash mật khẩu).
 * @param {Object} overrides - Ghi đè các field mặc định
 * @returns {Object} Document admin đã lưu vào DB
 */
async function createAdmin(overrides = {}) {
  return await createUser({
    hoTen: "Admin Test",
    email: `admin_${Date.now()}@gmail.com`,
    vaiTro: "admin",
    ...overrides,
  });
}

/**
 * Tạo danh mục nội thất.
 * @param {Object} overrides - Ghi đè các field mặc định
 * @returns {Object} Document danh mục đã lưu vào DB
 */
async function createCategory(overrides = {}) {
  return await LoaiNoiThat.create({
    mLoaiNoiThat: `LNT${Date.now()}`,
    tenLoai: "Bàn ghế",
    ...overrides,
  });
}

/**
 * Tạo sản phẩm nội thất.
 * @param {Object} overrides - Ghi đè các field mặc định
 * @returns {Object} Document sản phẩm đã lưu vào DB
 */
async function createProduct(overrides = {}) {
  return await NoiThat.create({
    mNoiThat: `NT${Date.now()}`,
    tenNoiThat: "Bàn gỗ cao cấp",
    gia: 5000000,
    donViTinh: "Cái",
    xuatXu: "Việt Nam",
    loaiNoiThat: "Bàn ghế",
    hinhAnh: "test-image.jpg",
    moTa: "Bàn gỗ tự nhiên chất lượng cao",
    tonKho: 50,
    ...overrides,
  });
}

/**
 * Tạo đơn hàng.
 * @param {Object} overrides - Ghi đè các field mặc định (bắt buộc noithatId)
 * @returns {Object} Document đơn hàng đã lưu vào DB
 */
async function createOrder(overrides = {}) {
  return await DonHang.create({
    soLuong: 1,
    tongTien: 5000000,
    trangThai: "Chờ xác nhận",
    ...overrides,
  });
}

/**
 * Đăng nhập qua Supertest agent và trả về session cookie.
 * @param {Object} agent - Supertest agent (request.agent(app))
 * @param {string} email - Email đăng nhập
 * @param {string} password - Mật khẩu (plaintext)
 * @returns {Object} agent đã đăng nhập (có session cookie)
 */
async function loginAs(agent, email, password = "123456") {
  await agent
    .post("/login")
    .send({ email, matKhau: password })
    .expect(302);
  return agent;
}

module.exports = {
  createUser,
  createAdmin,
  createCategory,
  createProduct,
  createOrder,
  loginAs,
};
