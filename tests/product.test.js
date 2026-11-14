/**
 * product.test.js — Kiểm thử luồng Sản phẩm (Products)
 * 
 * Bao gồm:
 * - Dashboard hiển thị sản phẩm (GET /dashboard)
 * - Tìm kiếm sản phẩm theo tên
 * - Lọc theo danh mục
 * - Phân trang
 * - Chi tiết sản phẩm (GET /product/:id)
 * - CRUD sản phẩm (Admin): thêm, sửa, xóa
 * - Kiểm tra API tồn kho (GET /api/stock/:id)
 */

const request = require("supertest");
const { connectDB, closeDB, clearDB } = require("./setup");
const {
  createUser,
  createAdmin,
  createCategory,
  createProduct,
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
// DASHBOARD — HIỂN THỊ SẢN PHẨM
// ============================================
describe("GET /dashboard — Hiển thị sản phẩm", () => {
  test("Trả về 200 khi truy cập dashboard", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.status).toBe(200);
  });

  test("Hiển thị sản phẩm trên dashboard", async () => {
    await createProduct({ tenNoiThat: "Sofa da cao cấp" });
    await createProduct({ tenNoiThat: "Tủ gỗ sồi" });

    const res = await request(app).get("/dashboard");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Sofa da cao cấp");
    expect(res.text).toContain("Tủ gỗ sồi");
  });

  test("Tìm kiếm sản phẩm theo tên (query ?search=)", async () => {
    await createProduct({ tenNoiThat: "Bàn ăn gỗ óc chó" });
    await createProduct({ tenNoiThat: "Ghế sofa nhung" });

    const res = await request(app).get("/dashboard?search=Bàn ăn");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Bàn ăn gỗ óc chó");
    expect(res.text).not.toContain("Ghế sofa nhung");
  });

  test("Lọc sản phẩm theo danh mục (query ?category=)", async () => {
    await createProduct({ tenNoiThat: "Bàn làm việc", loaiNoiThat: "Bàn" });
    await createProduct({ tenNoiThat: "Ghế gaming", loaiNoiThat: "Ghế" });

    const res = await request(app).get("/dashboard?category=Bàn");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Bàn làm việc");
    expect(res.text).not.toContain("Ghế gaming");
  });

  test("Phân trang hoạt động đúng (query ?page=&limit=)", async () => {
    // Tạo 5 sản phẩm, mỗi trang hiển thị 2
    for (let i = 1; i <= 5; i++) {
      await createProduct({
        mNoiThat: `NT_PAGE_${i}`,
        tenNoiThat: `Sản phẩm ${i}`,
      });
    }

    const page1 = await request(app).get("/dashboard?page=1&limit=2");
    expect(page1.status).toBe(200);

    const page3 = await request(app).get("/dashboard?page=3&limit=2");
    expect(page3.status).toBe(200);
  });
});

// ============================================
// CHI TIẾT SẢN PHẨM
// ============================================
describe("GET /product/:id — Chi tiết sản phẩm", () => {
  test("Hiển thị chi tiết sản phẩm hợp lệ", async () => {
    const product = await createProduct({ tenNoiThat: "Kệ tivi hiện đại" });

    const res = await request(app).get(`/product/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Kệ tivi hiện đại");
  });

  test("Trả về thông báo khi sản phẩm không tồn tại (invalid ID format)", async () => {
    const res = await request(app).get("/product/000000000000000000000000");

    expect(res.status).toBe(200);
    expect(res.text).toContain("không tồn tại");
  });
});

// ============================================
// API TỒN KHO
// ============================================
describe("GET /api/stock/:id — Kiểm tra tồn kho", () => {
  test("Trả về thông tin tồn kho của sản phẩm", async () => {
    const product = await createProduct({ tonKho: 25 });

    const res = await request(app).get(`/api/stock/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.tonKho).toBe(25);
  });
});

// ============================================
// QUẢN LÝ SẢN PHẨM (ADMIN)
// ============================================
describe("CRUD Sản phẩm (Admin)", () => {
  let adminAgent;

  beforeEach(async () => {
    await createAdmin({ email: "admin_product@gmail.com", matKhau: "123456" });
    adminAgent = request.agent(app);
    await loginAs(adminAgent, "admin_product@gmail.com", "123456");
  });

  test("GET /products — Admin xem danh sách sản phẩm", async () => {
    await createProduct({ tenNoiThat: "Bàn Admin Test" });

    const res = await adminAgent.get("/products");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Bàn Admin Test");
  });

  test("POST /products/add — Admin thêm sản phẩm mới (không ảnh)", async () => {
    await createCategory({ tenLoai: "Bàn" });

    const res = await adminAgent
      .post("/products/add")
      .field("mNoiThat", "NT_ADMIN_001")
      .field("tenNoiThat", "Bàn mới từ Admin")
      .field("gia", "3000000")
      .field("donViTinh", "Cái")
      .field("xuatXu", "Việt Nam")
      .field("loaiNoiThat", "Bàn")
      .field("moTa", "Mô tả sản phẩm test")
      .field("tonKho", "30");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/products");
  });

  test("POST /products/delete/:id — Admin xóa sản phẩm", async () => {
    const product = await createProduct({ tenNoiThat: "Sản phẩm sẽ xóa" });

    const res = await adminAgent.post(`/products/delete/${product._id}`);

    expect(res.status).toBe(302);

    // Xác nhận sản phẩm đã bị xóa khỏi DB
    const NoiThat = require("../models/noithat");
    const deleted = await NoiThat.findById(product._id);
    expect(deleted).toBeNull();
  });

  test("Khách không đăng nhập không thể xóa sản phẩm", async () => {
    const product = await createProduct();

    const res = await request(app).post(`/products/delete/${product._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});
