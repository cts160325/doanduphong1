/**
 * auth.test.js — Kiểm thử luồng Xác thực (Authentication)
 * 
 * Bao gồm:
 * - Đăng ký thành viên mới (POST /members/add)
 * - Đăng nhập thành công / thất bại (POST /login)
 * - Đăng xuất (GET /logout)
 * - Phân quyền: user không được vào /admin
 * - Bảo mật: XSS prevention trong input đăng ký
 */

const request = require("supertest");
const { connectDB, closeDB, clearDB } = require("./setup");
const { createUser, createAdmin, loginAs } = require("./helpers");

let app;

beforeAll(async () => {
  await connectDB();
  // Import app SAU KHI đã kết nối DB test
  app = require("../index").app;
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

// ============================================
// ĐĂNG KÝ THÀNH VIÊN
// ============================================
describe("POST /members/add — Đăng ký thành viên", () => {
  test("Đăng ký thành công với thông tin hợp lệ → redirect /login", async () => {
    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: "Nguyen Van A",
        email: "nguyenvana@gmail.com",
        matKhau: "123456",
        soDT: "0901234567",
        diaChi: "123 Nguyen Hue Q1",
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Đăng ký thất bại khi email đã tồn tại → render lại form với lỗi", async () => {
    await createUser({ email: "duplicate@gmail.com" });

    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: "Nguyen Van B",
        email: "duplicate@gmail.com",
        matKhau: "123456",
        soDT: "0987654321",
        diaChi: "456 Le Loi",
      });

    // Khi trùng email, server render lại form (200) thay vì redirect
    expect(res.status).toBe(200);
    expect(res.text).toContain("đã được sử dụng");
  });

  test("Đăng ký thất bại khi email không đúng định dạng", async () => {
    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: "Nguyen Van C",
        email: "invalid-email",
        matKhau: "123456",
        soDT: "0901111111",
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Email không đúng định dạng");
  });

  test("Đăng ký thất bại khi mật khẩu quá ngắn (< 6 ký tự)", async () => {
    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: "Nguyen Van D",
        email: "short@gmail.com",
        matKhau: "123",
        soDT: "0902222222",
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Mật khẩu quá yếu");
  });

  test("Đăng ký thất bại khi số điện thoại > 10 ký tự", async () => {
    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: "Nguyen Van E",
        email: "longphone@gmail.com",
        matKhau: "123456",
        soDT: "09012345678999",
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Số điện thoại không được vượt quá 10 chữ số");
  });

  test("Chặn XSS: đăng ký với tên chứa HTML tag bị từ chối", async () => {
    const res = await request(app)
      .post("/members/add")
      .send({
        hoTen: '<script>alert("xss")</script>',
        email: "xss@gmail.com",
        matKhau: "123456",
        soDT: "0903333333",
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain("ký tự không hợp lệ");
  });
});

// ============================================
// ĐĂNG NHẬP
// ============================================
describe("POST /login — Đăng nhập", () => {
  test("Đăng nhập thành công với email + mật khẩu đúng → redirect /dashboard", async () => {
    await createUser({ email: "login@gmail.com", matKhau: "123456" });

    const res = await request(app)
      .post("/login")
      .send({ email: "login@gmail.com", matKhau: "123456" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/dashboard");
  });

  test("Đăng nhập thất bại khi email không tồn tại → render lỗi", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "notexist@gmail.com", matKhau: "123456" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Sai email hoặc mật khẩu");
  });

  test("Đăng nhập thất bại khi mật khẩu sai → render lỗi", async () => {
    await createUser({ email: "wrongpass@gmail.com", matKhau: "123456" });

    const res = await request(app)
      .post("/login")
      .send({ email: "wrongpass@gmail.com", matKhau: "wrong-password" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Sai email hoặc mật khẩu");
  });

  test("Admin đăng nhập thành công → redirect /dashboard", async () => {
    await createAdmin({ email: "admin@gmail.com", matKhau: "admin123" });

    const res = await request(app)
      .post("/login")
      .send({ email: "admin@gmail.com", matKhau: "admin123" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/dashboard");
  });
});

// ============================================
// ĐĂNG XUẤT
// ============================================
describe("GET /logout — Đăng xuất", () => {
  test("Đăng xuất thành công → redirect /", async () => {
    const res = await request(app).get("/logout");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
  });
});

// ============================================
// PHÂN QUYỀN (RBAC)
// ============================================
describe("Phân quyền — RBAC", () => {
  test("Khách chưa đăng nhập truy cập /admin → redirect /login", async () => {
    const res = await request(app).get("/admin");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("User thường truy cập /admin → redirect /login", async () => {
    const user = await createUser({ email: "user@gmail.com", matKhau: "123456" });
    const agent = request.agent(app);
    await loginAs(agent, "user@gmail.com", "123456");

    const res = await agent.get("/admin");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("User thường truy cập /members → redirect /login", async () => {
    const user = await createUser({ email: "user2@gmail.com", matKhau: "123456" });
    const agent = request.agent(app);
    await loginAs(agent, "user2@gmail.com", "123456");

    const res = await agent.get("/members");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Trang đăng nhập GET /login render bình thường", async () => {
    const res = await request(app).get("/login");

    expect(res.status).toBe(200);
  });
});
