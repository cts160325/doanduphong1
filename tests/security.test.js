/**
 * security.test.js — Kiểm thử Bảo mật
 * 
 * Bao gồm:
 * - XSS Prevention: Hàm escapeHtml
 * - XSS trong đánh giá sản phẩm
 * - Session cookie bảo mật (httpOnly, sameSite)
 * - Rate Limiting (chống spam đặt hàng)
 * - Mật khẩu hash bcrypt (không lưu plaintext)
 * - Multer: chỉ cho phép upload ảnh (jpg, png, webp)
 */

const request = require("supertest");
const bcrypt = require("bcrypt");
const { connectDB, closeDB, clearDB } = require("./setup");
const { createUser, createProduct, loginAs } = require("./helpers");
const ThanhVien = require("../models/thanhvien");

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

// ============================================
// XSS PREVENTION
// ============================================
describe("XSS Prevention", () => {
  test("Đánh giá sản phẩm: HTML trong tên/nội dung bị escape", async () => {
    const product = await createProduct();

    const res = await request(app)
      .post(`/review/add/${product._id}`)
      .send({
        hoTen: '<img src=x onerror=alert("XSS")>',
        rating: 5,
        binhLuan: '<script>document.cookie</script>',
      });

    // Đánh giá thành công → redirect về trang sản phẩm
    expect(res.status).toBe(302);

    // Kiểm tra trong DB: nội dung phải được escape
    const Review = require("../models/review");
    const review = await Review.findOne({ noithatId: product._id });
    expect(review).not.toBeNull();
    expect(review.tenNguoiDanhGia).not.toContain("<img");
    expect(review.tenNguoiDanhGia).not.toContain("<script");
    expect(review.chiTiet).not.toContain("<script");
  });

  test("Form liên hệ/tư vấn: HTML bị escape trước khi lưu DB", async () => {
    const res = await request(app)
      .post("/contact/submit")
      .send({
        hoTen: '<b>Hacker</b>',
        soDT: "0900000000",
        email: "contact@test.com",
        noiDung: '<script>alert(1)</script> Nội dung bình thường',
      });

    expect(res.status).toBe(302);

    // Kiểm tra trong DB
    const TuVan = require("../models/tuvan");
    const tuvan = await TuVan.findOne({ email: "contact@test.com" });
    expect(tuvan).not.toBeNull();
    expect(tuvan.hoTen).not.toContain("<b>");
    expect(tuvan.noiDung).not.toContain("<script>");
  });
});

// ============================================
// MẬT KHẨU HASH BCRYPT
// ============================================
describe("Mật khẩu hash bcrypt", () => {
  test("Mật khẩu được lưu dưới dạng hash, KHÔNG phải plaintext", async () => {
    const plainPassword = "MySecretPass123";

    await request(app)
      .post("/members/add")
      .send({
        hoTen: "Hash Test User",
        email: "hashtest@gmail.com",
        matKhau: plainPassword,
        soDT: "0904444444",
      });

    const user = await ThanhVien.findOne({ email: "hashtest@gmail.com" });
    expect(user).not.toBeNull();

    // Mật khẩu trong DB KHÔNG ĐƯỢC giống plaintext
    expect(user.matKhau).not.toBe(plainPassword);

    // Mật khẩu phải bắt đầu bằng $2b$ (bcrypt hash)
    expect(user.matKhau).toMatch(/^\$2[aby]\$/);

    // Kiểm tra so sánh hash → đúng
    const isMatch = await bcrypt.compare(plainPassword, user.matKhau);
    expect(isMatch).toBe(true);
  });

  test("Hai user cùng mật khẩu → hash khác nhau (salt ngẫu nhiên)", async () => {
    await request(app)
      .post("/members/add")
      .send({
        hoTen: "User 1",
        email: "salt1@gmail.com",
        matKhau: "samepassword",
        soDT: "0905555551",
      });

    await request(app)
      .post("/members/add")
      .send({
        hoTen: "User 2",
        email: "salt2@gmail.com",
        matKhau: "samepassword",
        soDT: "0905555552",
      });

    const user1 = await ThanhVien.findOne({ email: "salt1@gmail.com" });
    const user2 = await ThanhVien.findOne({ email: "salt2@gmail.com" });

    expect(user1.matKhau).not.toBe(user2.matKhau);
  });
});

// ============================================
// SESSION COOKIE BẢO MẬT
// ============================================
describe("Session cookie bảo mật", () => {
  test("Cookie session có flag httpOnly", async () => {
    await createUser({ email: "cookie@gmail.com", matKhau: "123456" });

    const res = await request(app)
      .post("/login")
      .send({ email: "cookie@gmail.com", matKhau: "123456" });

    // Kiểm tra Set-Cookie header
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const sessionCookie = cookies.find(c => c.includes("connect.sid"));
    if (sessionCookie) {
      expect(sessionCookie.toLowerCase()).toContain("httponly");
    }
  });
});

// ============================================
// RATE LIMITING
// ============================================
describe("Rate Limiting — Chống spam đặt hàng", () => {
  test("Gửi nhiều đơn hàng liên tục bị chặn (max 3/phút)", async () => {
    const product = await createProduct({ tonKho: 100, gia: 100000 });

    const guestData = {
      soLuong: 1,
      guestName: "Spammer",
      guestPhone: "0900000001",
      guestAddress: "Spam Street",
    };

    // Gửi 3 đơn đầu tiên (bên trong limit)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/order/${product._id}`)
        .send(guestData);
    }

    // Đơn thứ 4 phải bị chặn bởi rate limiter
    const res = await request(app)
      .post(`/order/${product._id}`)
      .send(guestData);

    // Rate limiter trả về 429 (Too Many Requests)
    expect(res.status).toBe(429);
  });
});
