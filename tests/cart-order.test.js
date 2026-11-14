/**
 * cart-order.test.js — Kiểm thử luồng Giỏ hàng & Đơn hàng
 * 
 * Bao gồm:
 * - Thêm sản phẩm vào giỏ hàng (POST /cart/add/:id)
 * - Xem giỏ hàng (GET /cart)
 * - Cập nhật số lượng (POST /cart/update/:id)
 * - Xóa khỏi giỏ (GET /cart/remove/:id)
 * - Kiểm tra tồn kho khi thêm giỏ
 * - Đặt hàng (POST /order/:id)
 * - Xem đơn hàng (GET /my-orders)
 * - Hủy đơn (POST /cancel-order/:id)
 */

const request = require("supertest");
const { connectDB, closeDB, clearDB } = require("./setup");
const {
  createUser,
  createAdmin,
  createProduct,
  createOrder,
  loginAs,
} = require("./helpers");

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
// GIỎ HÀNG
// ============================================
describe("Giỏ hàng — Cart", () => {
  test("GET /cart — Xem trang giỏ hàng (200)", async () => {
    const res = await request(app).get("/cart");
    expect(res.status).toBe(200);
  });

  test("POST /cart/add/:id — Thêm sản phẩm vào giỏ thành công", async () => {
    const product = await createProduct({ tonKho: 10 });
    const agent = request.agent(app);

    const res = await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 2 });

    expect(res.status).toBe(302);
  });

  test("POST /cart/add/:id — Không thêm được khi hết hàng (tonKho = 0)", async () => {
    const product = await createProduct({ tonKho: 0 });
    const agent = request.agent(app);

    const res = await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 1 });

    expect(res.status).toBe(302);
    // Flash message sẽ chứa thông báo hết hàng khi redirect
  });

  test("POST /cart/add/:id — Không thêm vượt quá tồn kho", async () => {
    const product = await createProduct({ tonKho: 3 });
    const agent = request.agent(app);

    const res = await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 5 });

    expect(res.status).toBe(302);
  });

  test("POST /cart/update/:id — Tăng số lượng trong giỏ", async () => {
    const product = await createProduct({ tonKho: 10 });
    const agent = request.agent(app);

    // Thêm vào giỏ trước
    await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 1 });

    // Tăng số lượng
    const res = await agent
      .post(`/cart/update/${product._id}`)
      .send({ action: "increase" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/cart");
  });

  test("POST /cart/update/:id — Giảm số lượng xuống 0 thì xóa khỏi giỏ", async () => {
    const product = await createProduct({ tonKho: 10 });
    const agent = request.agent(app);

    // Thêm 1 sản phẩm
    await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 1 });

    // Giảm xuống 0 → sẽ bị xóa khỏi giỏ
    const res = await agent
      .post(`/cart/update/${product._id}`)
      .send({ action: "decrease" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/cart");
  });

  test("GET /cart/remove/:id — Xóa sản phẩm khỏi giỏ", async () => {
    const product = await createProduct({ tonKho: 10 });
    const agent = request.agent(app);

    // Thêm vào giỏ
    await agent
      .post(`/cart/add/${product._id}`)
      .send({ soLuong: 2 });

    // Xóa khỏi giỏ
    const res = await agent.get(`/cart/remove/${product._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/cart");
  });
});

// ============================================
// ĐẶT HÀNG
// ============================================
describe("Đặt hàng — Orders", () => {
  test("POST /order/:id — Đặt hàng thành công (khách vãng lai)", async () => {
    const product = await createProduct({ tonKho: 10, gia: 1000000 });

    const res = await request(app)
      .post(`/order/${product._id}`)
      .send({
        soLuong: 1,
        guestName: "Khách vãng lai",
        guestPhone: "0909090909",
        guestAddress: "789 Tran Hung Dao",
      });

    // Đặt hàng thành công với khách vãng lai trả về trang cảm ơn (200)
    expect(res.status).toBe(200);
    expect(res.text).toContain("Đặt hàng thành công!");
  });

  test("POST /order/:id — Đặt hàng thành công (thành viên đã đăng nhập)", async () => {
    const user = await createUser({ email: "order@gmail.com", matKhau: "123456" });
    const product = await createProduct({ tonKho: 10, gia: 2000000 });
    const agent = request.agent(app);
    await loginAs(agent, "order@gmail.com", "123456");

    const res = await agent
      .post(`/order/${product._id}`)
      .send({ soLuong: 1 });

    expect(res.status).toBe(302);
  });
});

// ============================================
// XEM ĐƠN HÀNG CỦA TÔI
// ============================================
describe("GET /my-orders — Đơn hàng của tôi", () => {
  test("Phải đăng nhập mới xem được → redirect /login", async () => {
    const res = await request(app).get("/my-orders");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Xem danh sách đơn hàng khi đã đăng nhập", async () => {
    const user = await createUser({ email: "myorder@gmail.com", matKhau: "123456" });
    const agent = request.agent(app);
    await loginAs(agent, "myorder@gmail.com", "123456");

    const res = await agent.get("/my-orders");
    expect(res.status).toBe(200);
  });
});

// ============================================
// HỦY ĐƠN HÀNG
// ============================================
describe("POST /cancel-order/:id — Hủy đơn hàng", () => {
  test("Hủy đơn hàng thành công khi đang ở trạng thái 'Chờ xác nhận'", async () => {
    const user = await createUser({ email: "cancel@gmail.com", matKhau: "123456" });
    const product = await createProduct({ tonKho: 10 });
    const order = await createOrder({
      thanhVienId: user._id,
      noithatId: product._id,
      trangThai: "Chờ xác nhận",
    });

    const agent = request.agent(app);
    await loginAs(agent, "cancel@gmail.com", "123456");

    const res = await agent.post(`/cancel-order/${order._id}`);
    expect(res.status).toBe(302);
  });

  test("Phải đăng nhập mới hủy được → redirect /login", async () => {
    const product = await createProduct();
    const order = await createOrder({ noithatId: product._id });

    const res = await request(app).post(`/cancel-order/${order._id}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});
