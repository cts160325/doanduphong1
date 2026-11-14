require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const connect = require("./models/connect.js");
const loaiNoiThat = require("./models/loainoithat.js");
const noiThat = require("./models/noithat.js");
const thanhVien = require("./models/thanhvien.js");
const donHang = require("./models/donhang.js");
const Review = require("./models/review.js");
const HeThong = require("./models/hethong.js");
const ThongBao = require("./models/thongbao.js");
const TuVan = require("./models/tuvan.js");
const TraHang = require("./models/traHang.js");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/");
  },
  filename: function (req, file, cb) {
    // Rename file random
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép jpg/png/webp
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ cho phép tải lên file ảnh (jpg, png, webp)!"));
  }
});

const rateLimit = require("express-rate-limit");
const morgan = require("morgan"); // Logging (Slide 14)
const flash = require("connect-flash");

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 3, // limit each IP to 3 orders per windowMs
  message: "Bạn thao tác quá nhanh (Spam). Vui lòng thử lại sau 1 phút!"
});

const app = express();
// Kích hoạt Logging toàn bộ API
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "bt-nodejs-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Bảo mật XSS
      sameSite: "strict", // Ngăn chặn CSRF (Slide 11)
      maxAge: 1000 * 60 * 60 * 24 // Session sống 1 ngày
    }
  })
);

app.set("view engine", "ejs");
app.use(flash());

// Middleware truyền thông tin user và giỏ hàng cho toàn bộ giao diện EJS
app.use(async (req, res, next) => {
  // Xác định user hiển thị cho EJS: Nếu đang ở các đường dẫn admin, dùng adminUser
  const isAdminPath = req.path.startsWith("/admin") || 
                      req.path.startsWith("/order-list") || 
                      req.path.startsWith("/products") || 
                      req.path.startsWith("/categories") || 
                      req.path.startsWith("/members");
  
  if (isAdminPath && req.session.adminUser) {
    res.locals.user = req.session.adminUser;
  } else {
    res.locals.user = req.session.user || null;
  }

  res.locals.cart = req.session.cart || {};
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.cartCount = Object.values(res.locals.cart).reduce((sum, item) => sum + item.soLuong, 0);
  
  // Load system settings
  try {
    const settings = await HeThong.find({});
    const settingsObj = {
      site_name: "Nội Thất SSC",
      site_logo_text: "SSC",
      site_phone: "0337534263",
      site_email_support: "support@noithatssc.vn",
      site_address_cs1: "Cầu Giấy - Hà Nội"
    };
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.locals.settings = settingsObj;
  } catch (err) {
    res.locals.settings = { site_name: "Nội Thất SSC", site_logo_text: "SSC" };
  }

  // Đếm thông báo chưa đọc cho user (Chỉ áp dụng với tài khoản khách thường)
  res.locals.notificationCount = 0;
  const normalUser = req.session.user;
  if (normalUser && normalUser.vaiTro !== 'admin') {
    try {
      res.locals.notificationCount = await ThongBao.countDocuments({
        thanhVienId: normalUser._id,
        trangThai: "chua_doc"
      });
    } catch (err) {}
  }
  next();
});
app.set("views", "./views");

function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function checkAdmin(req, res, next) {
  // Ưu tiên kiểm tra adminUser được lưu trữ độc lập để tránh xung đột đa tab khi khách đăng nhập tab khác
  if (req.session.adminUser && req.session.adminUser.vaiTro === "admin") {
    return next();
  }
  
  // Dự phòng nếu chưa set adminUser nhưng user hiện tại là admin
  if (req.session.user && req.session.user.vaiTro === "admin") {
    req.session.adminUser = req.session.user;
    return next();
  }

  // Nếu không có quyền, chuyển hướng về trang đăng nhập kèm thông báo
  req.flash("error", "Vui lòng đăng nhập tài khoản Admin để truy cập trang quản trị!");
  return res.redirect("/login");
}

// Xử lý XSS (Slide 12): Hàm escape HTML
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== "string") return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/store", (req, res) => {
  res.render("store/store");
});
 
app.get("/contact", (req, res) => {
  res.render("store/contact");
});

app.post("/contact/submit", async (req, res) => {
  try {
    const { hoTen, soDT, email, noiDung } = req.body;
    
    // HTML Escape content to prevent XSS
    const cleanHoTen = hoTen.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanNoiDung = noiDung.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await TuVan.create({
      hoTen: cleanHoTen,
      soDT,
      email,
      noiDung: cleanNoiDung
    });

    req.flash("success", "Gửi yêu cầu thành công! Chúng tôi sẽ liên lạc với bạn sớm nhất.");
    res.redirect("/contact");
  } catch (err) {
    console.error(err);
    req.flash("error", "Đã xảy ra lỗi khi gửi yêu cầu tư vấn. Vui lòng thử lại!");
    res.redirect("/contact");
  }
});

app.get("/login", (req, res) => {
  try {
    // Lưu trang trước đó để sau khi login sẽ quay lại (tránh xung đột tab)
    if (req.get("Referer") && !req.get("Referer").includes("/login") && !req.get("Referer").includes("/members/add")) {
      req.session.returnTo = req.get("Referer");
    }
    res.render("auth/login", { error: null });
  } catch (err) {
    console.error("Lỗi tải trang đăng nhập:", err);
    res.status(500).send("Lỗi server");
  }
});
 
app.post("/login", async (req, res) => {
  const { email, matKhau } = req.body;
 
  try {
    const user = await thanhVien.findOne({ email });
    if (!user) {
      return res.render("auth/login", { error: "Sai email hoặc mật khẩu", email: email });
    }
    // So sánh mật khẩu bằng bcrypt
    const isMatch = await bcrypt.compare(matKhau, user.matKhau);
    if (!isMatch) {
      return res.render("auth/login", { error: "Sai email hoặc mật khẩu", email: email });
    }
    req.session.user = user;
    if (user.vaiTro === "admin") {
      req.session.adminUser = user;
    }
    // Quay lại trang trước khi login (giảm xung đột khi dùng nhiều tab)
    const returnTo = req.session.returnTo || "/dashboard";
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    console.log(err);
    res.send("Lỗi đăng nhập");
  }
});

// Trang quản trị Admin
app.get("/admin", checkAdmin, async (req, res) => {
  try {
    const totalProducts = await noiThat.countDocuments();
    const totalOrders = await donHang.countDocuments();
    const totalMembers = await thanhVien.countDocuments();
    const pendingOrders = await donHang.countDocuments({ trangThai: "Chờ xác nhận" });
    const deliveringOrders = await donHang.countDocuments({ trangThai: "Đang giao" });
    const completedOrders = await donHang.countDocuments({ trangThai: "Hoàn thành" });
    const cancelledOrders = await donHang.countDocuments({ trangThai: "Đã hủy" });
    const lowStockProducts = await noiThat.countDocuments({ tonKho: { $lte: 5 } });
    const totalReviews = await Review.countDocuments();
    
    // Lấy 5 đơn hàng mới nhất
    const recentOrders = await donHang.find()
      .sort({ ngayDat: -1 })
      .limit(5)
      .populate("thanhVienId")
      .populate("noithatId");

    // Tính tổng doanh thu (Không tính các đơn đã hủy)
    const revenueStats = await donHang.aggregate([
      { $match: { trangThai: { $ne: "Đã hủy" } } },
      { $group: { _id: null, total: { $sum: "$tongTien" } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // Tính doanh thu thực tế (Chỉ tính các đơn hoàn thành)
    const completedRevenueStats = await donHang.aggregate([
      { $match: { trangThai: "Hoàn thành" } },
      { $group: { _id: null, total: { $sum: "$tongTien" } } }
    ]);
    const completedRevenue = completedRevenueStats.length > 0 ? completedRevenueStats[0].total : 0;

    // Lấy 8 thông báo mới nhất cho Admin
    const adminNotifications = await ThongBao.find({ thanhVienId: req.session.user._id })
      .sort({ ngayGui: -1 })
      .limit(8)
      .populate("donHangId");

    // Lấy danh sách yêu cầu tư vấn mới nhất (TuVan)
    const tuVanRequests = await TuVan.find()
      .sort({ ngayGui: -1 })
      .limit(10);

    res.render("admin/admin", {
      user: req.session.user,
      totalProducts,
      totalOrders,
      totalMembers,
      pendingOrders,
      deliveringOrders,
      completedOrders,
      cancelledOrders,
      recentOrders,
      totalRevenue,
      completedRevenue,
      lowStockProducts,
      totalReviews,
      adminNotifications,
      tuVanRequests
    });

  } catch (err) {
    console.log(err);
    res.send("Lỗi tải trang quản trị");
  }
});

// Xóa thông báo của Admin
app.post("/admin/notifications/delete/:id", checkAdmin, async (req, res) => {
  try {
    await ThongBao.findByIdAndDelete(req.params.id);
    req.flash("success", "Đã xóa thông báo thành công!");
    res.redirect("/admin");
  } catch (err) {
    req.flash("error", "Lỗi xóa thông báo: " + err.message);
    res.redirect("/admin");
  }
});

// Đánh dấu yêu cầu tư vấn là Đã liên hệ
app.post("/admin/consultations/contacted/:id", checkAdmin, async (req, res) => {
  try {
    await TuVan.findByIdAndUpdate(req.params.id, { trangThai: "Đã liên hệ" });
    req.flash("success", "Đã đánh dấu đã liên hệ thành công!");
    res.redirect("/admin");
  } catch (err) {
    req.flash("error", "Lỗi cập nhật yêu cầu: " + err.message);
    res.redirect("/admin");
  }
});

// Xóa yêu cầu tư vấn
app.post("/admin/consultations/delete/:id", checkAdmin, async (req, res) => {
  try {
    await TuVan.findByIdAndDelete(req.params.id);
    req.flash("success", "Đã xóa yêu cầu tư vấn thành công!");
    res.redirect("/admin");
  } catch (err) {
    req.flash("error", "Lỗi xóa yêu cầu tư vấn: " + err.message);
    res.redirect("/admin");
  }
});

app.get("/logout", (req, res) => {
  try {
    req.session.destroy(() => {
      res.redirect("/");
    });
  } catch (err) {
    console.error("Lỗi đăng xuất:", err);
    res.status(500).send("Lỗi server");
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Lấy query filter category + search
    const selectedCategory = req.query.category || "";
    const searchQuery = req.query.search || "";
    let filter = {};
    if (selectedCategory) {
      filter.loaiNoiThat = selectedCategory;
    }
    if (searchQuery) {
      filter.tenNoiThat = { $regex: searchQuery, $options: "i" };
    }

    const products = await noiThat.find(filter).skip(skip).limit(limit);
    const totalProducts = await noiThat.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Lấy danh mục để làm bộ lọc
    const categories = await loaiNoiThat.find();

    // Lấy đơn hàng gần nhất của khách (nếu đã đăng nhập và không phải admin)
    let latestOrder = null;
    if (req.session.user && req.session.user.vaiTro !== 'admin') {
      latestOrder = await donHang.findOne({ thanhVienId: req.session.user._id })
                                 .sort({ ngayDat: -1 })
                                 .populate('noithatId');
    }

    res.render("store/dashboard", {
      user: req.session.user,
      products: products,
      categories: categories,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      selectedCategory: selectedCategory,
      searchQuery: searchQuery,
      latestOrder: latestOrder // Truyền đơn hàng gần nhất vào view
    });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải dashboard");
  }
});
 
// --- TRANG CHI TIẾT SẢN PHẨM ---
app.get("/product/:id", async (req, res) => {
  try {
    const product = await noiThat.findById(req.params.id);
    if (!product) return res.send("Sản phẩm không tồn tại");
 
    // Lấy đánh giá của sản phẩm
    const reviews = await Review.find({ noithatId: product._id }).sort({ ngayTao: -1 });
 
    // Lấy sản phẩm liên quan (cùng loại, trừ sản phẩm hiện tại)
    const relatedProducts = await noiThat.find({
      loaiNoiThat: product.loaiNoiThat,
      _id: { $ne: product._id }
    }).limit(4);
 
    res.render("store/product-detail", {
      product,
      reviews,
      relatedProducts,
      user: req.session.user || null
    });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải trang chi tiết sản phẩm");
  }
});

// Đánh giá sản phẩm
app.post(["/review/add/:id", "/product/:id/review"], async (req, res) => {
  try {
    const noithatId = req.params.id;
    const nameInput = req.body.hoTen || req.body.tenNguoiDanhGia || "Khách hàng";
    const starInput = parseInt(req.body.rating || req.body.soSao) || 5;
    const commentInput = req.body.binhLuan || req.body.chiTiet || "";
    const levelInput = req.body.mucDo || (starInput >= 4 ? "Rất hài lòng" : "Hài lòng");

    // Escape HTML trước khi lưu chống XSS
    const cleanName = escapeHtml(nameInput);
    const cleanComment = escapeHtml(commentInput);

    await Review.create({
      noithatId: noithatId,
      tenNguoiDanhGia: cleanName,
      soSao: starInput,
      mucDo: levelInput,
      chiTiet: cleanComment
    });

    req.flash("success", "Cảm ơn bạn đã gửi đánh giá sản phẩm thành công!");
    res.redirect("/product/" + noithatId);
  } catch (err) {
    console.log(err);
    req.flash("error", "Đã xảy ra lỗi khi gửi đánh giá sản phẩm.");
    res.redirect("/product/" + req.params.id);
  }
});

// --- BẮT ĐẦU GIỎ HÀNG ---
app.post("/cart/add/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const soLuong = parseInt(req.body.soLuong) || 1;
    const product = await noiThat.findById(productId);
    
    if (!product) return res.send("Sản phẩm không tồn tại");

    // Kiểm tra tồn kho trước khi thêm
    if (product.tonKho <= 0) {
      req.flash("error", `Sản phẩm "${product.tenNoiThat}" đã hết hàng! Vui lòng liên hệ người bán.`);
      return res.redirect(req.get("Referer") || "/dashboard");
    }

    if (!req.session.cart) req.session.cart = {};

    const currentQty = req.session.cart[productId] ? req.session.cart[productId].soLuong : 0;
    const newQty = currentQty + soLuong;

    // Cảnh báo nếu số lượng yêu cầu vượt tồn kho
    if (newQty > product.tonKho) {
      req.flash("error", `Không đủ hàng! "${product.tenNoiThat}" chỉ còn ${product.tonKho} sản phẩm. Vui lòng giảm số lượng hoặc liên hệ người bán.`);
      return res.redirect(req.get("Referer") || "/dashboard");
    }

    if (req.session.cart[productId]) {
      req.session.cart[productId].soLuong = newQty;
    } else {
      req.session.cart[productId] = {
        _id: product._id,
        tenNoiThat: product.tenNoiThat,
        gia: product.gia,
        hinhAnh: product.hinhAnh,
        donViTinh: product.donViTinh,
        tonKho: product.tonKho,
        soLuong: soLuong
      };
    }
    // Cập nhật tonKho mới nhất vào session
    req.session.cart[productId].tonKho = product.tonKho;

    const referer = req.get("Referer") || "/dashboard";
    res.redirect(referer);
  } catch (err) {
    res.send("Lỗi thêm vào giỏ hàng");
  }
});

app.get("/cart", (req, res) => {
  res.render("store/cart");
});

app.post("/cart/update/:id", async (req, res) => {
  const productId = req.params.id;
  const action = req.body.action; // "increase" or "decrease"
  
  if (req.session.cart && req.session.cart[productId]) {
    if (action === "increase") {
      // Kiểm tra tồn kho real-time trước khi tăng
      const product = await noiThat.findById(productId);
      const newQty = req.session.cart[productId].soLuong + 1;
      if (product && newQty > product.tonKho) {
        req.flash("error", `Không thể tăng thêm! "${product.tenNoiThat}" chỉ còn ${product.tonKho} sản phẩm trong kho. Liên hệ người bán để đặt thêm.`);
        return res.redirect("/cart");
      }
      req.session.cart[productId].soLuong = newQty;
      if (product) req.session.cart[productId].tonKho = product.tonKho;
    } else if (action === "decrease") {
      req.session.cart[productId].soLuong--;
      if (req.session.cart[productId].soLuong <= 0) {
        delete req.session.cart[productId];
      }
    }
  }
  res.redirect("/cart");
});

app.get("/cart/remove/:id", (req, res) => {
  if (req.session.cart && req.session.cart[req.params.id]) {
    delete req.session.cart[req.params.id];
  }
  res.redirect("/cart");
});

function calculateVoucherDiscount(code, amount) {
  if (!code) return { discount: 0, code: "" };
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode === 'WELCOME10') {
    return { discount: Math.round(amount * 0.1), code: cleanCode };
  } else if (cleanCode === 'VIP15') {
    return { discount: Math.round(amount * 0.15), code: cleanCode };
  } else if (cleanCode === 'NOITHAT50K') {
    return { discount: Math.min(amount, 50000), code: cleanCode };
  }
  return { discount: 0, code: "" };
}

app.post("/cart/checkout", orderLimiter, async (req, res) => {
  try {
    const cart = req.session.cart;
    if (!cart || Object.keys(cart).length === 0) return res.send("Giỏ hàng trống!");

    let thanhVienId = null;
    let guestInfo = null;

    if (req.session.user) {
      thanhVienId = req.session.user._id;
    } else {
      guestInfo = {
        hoTen: req.body.guestName,
        soDT: req.body.guestPhone,
        diaChi: req.body.guestAddress
      };
      if (!guestInfo.hoTen || !guestInfo.soDT) return res.send("Vui lòng nhập tên và số điện thoại!");
    }

    // Kiểm tra tồn kho trước khi đặt hàng
    const items = Object.values(cart);
    const outOfStockItems = [];
    for (let item of items) {
      const product = await noiThat.findById(item._id);
      if (!product || product.tonKho < item.soLuong) {
        outOfStockItems.push({
          ten: item.tenNoiThat,
          yeuCau: item.soLuong,
          conLai: product ? product.tonKho : 0
        });
      }
    }

    if (outOfStockItems.length > 0) {
      const msg = outOfStockItems.map(i => 
        `"${i.ten}": yêu cầu ${i.yeuCau}, kho chỉ còn ${i.conLai}`
      ).join('; ');
      req.flash("error", `Không đủ hàng! ${msg}. Vui lòng giảm số lượng hoặc liên hệ người bán.`);
      return res.redirect("/cart");
    }

    for (let item of items) {
      const soLuong = item.soLuong;
      
      // Khách xác định mua -> Giảm số lượng tồn kho (Atomic update)
      const sanPham = await noiThat.findOneAndUpdate(
        { _id: item._id, tonKho: { $gte: soLuong } },
        { $inc: { tonKho: -soLuong } },
        { new: true }
      );

      if (!sanPham) {
        req.flash("error", `Sản phẩm "${item.tenNoiThat}" không đủ hàng hoặc đã bị mua hết. Vui lòng giảm số lượng.`);
        return res.redirect("/cart");
      }

      let tongTien = sanPham.gia * soLuong;
      let giamGia = 0;
      if (soLuong >= 10) giamGia = 20;
      else if (soLuong >= 5) giamGia = 10;
      if (giamGia > 0) tongTien = tongTien - (tongTien * giamGia) / 100;

      // Áp dụng mã Voucher giảm giá nếu khách chọn
      const voucherCode = req.body.voucherCode ? req.body.voucherCode.trim().toUpperCase() : "";
      if (voucherCode) {
        const vInfo = calculateVoucherDiscount(voucherCode, tongTien);
        if (vInfo.discount > 0) {
          tongTien = Math.max(0, tongTien - vInfo.discount);
        }
      }

      await donHang.create({
        thanhVienId: thanhVienId,
        guestInfo: guestInfo,
        noithatId: item._id,
        soLuong: soLuong,
        tongTien: tongTien,
        giamGia: giamGia,
        maGiamGia: voucherCode
      });

      // Báo Admin nếu kho thấp
      if (sanPham.tonKho <= 5) {
        const admins = await thanhVien.find({ vaiTro: "admin" });
        for (const admin of admins) {
          await ThongBao.create({
            thanhVienId: admin._id,
            noiDung: `⚠️ Cảnh báo tồn kho: "${sanPham.tenNoiThat}" chỉ còn ${sanPham.tonKho} sản phẩm!${sanPham.tonKho === 0 ? ' ĐÃ HẾT HÀNG!' : ''}`,
            loai: "thong_bao_chung",
            trangThai: "chua_doc"
          });
        }
      }
    }

    // Xóa giỏ hàng sau khi đặt thành công
    req.session.cart = {};

    if (thanhVienId) {
      res.redirect("/my-orders");
    } else {
      res.send(`
        <html><head><meta charset="utf-8"><title>Đặt hàng thành công</title><link href="/bootstrap/bootstrap.min.css" rel="stylesheet" /></head>
        <body class="bg-light d-flex align-items-center justify-content-center vh-100"><div class="text-center p-5 bg-white shadow rounded-4"><h1 class="text-success mb-3">🎉 Đặt hàng thành công!</h1><p class="lead">Cảm ơn <b>${guestInfo.hoTen}</b> đã mua sắm. Chúng tôi sẽ giao hàng đến: <b>${guestInfo.diaChi}</b>.</p><a href="/dashboard" class="btn btn-success mt-3 rounded-pill px-4">Tiếp tục mua sắm</a></div></body></html>
      `);
    }
  } catch (err) {
    res.send("Lỗi đặt hàng giỏ hàng");
  }
});
// --- KẾT THÚC GIỎ HÀNG ---

app.get("/checkout/:id", async (req, res) => {
  try {
    const sanPham = await noiThat.findById(req.params.id);
    if (!sanPham) return res.send("Sản phẩm không tồn tại");
    const soLuong = parseInt(req.query.soLuong) || 1;
    res.render("store/checkout", { 
      product: sanPham, 
      soLuong: soLuong, 
      user: req.session.user || null 
    });
  } catch (err) {
    res.send("Lỗi tải trang thanh toán");
  }
});

// API kiểm tra tồn kho (cho AJAX frontend)
app.get("/api/stock/:id", async (req, res) => {
  try {
    const product = await noiThat.findById(req.params.id).select("tenNoiThat tonKho");
    if (!product) return res.json({ error: "Sản phẩm không tồn tại", tonKho: 0 });
    res.json({ tenNoiThat: product.tenNoiThat, tonKho: product.tonKho });
  } catch (err) {
    res.json({ error: "Lỗi kiểm tra tồn kho", tonKho: 0 });
  }
});

app.post("/order/:id", orderLimiter, async (req, res) => {
  try {
    const noithatId = req.params.id;
    let thanhVienId = null;
    let guestInfo = null;

    if (req.session.user) {
      thanhVienId = req.session.user._id;
    } else {
      guestInfo = {
        hoTen: req.body.guestName,
        soDT: req.body.guestPhone,
        diaChi: req.body.guestAddress
      };
      if (!guestInfo.hoTen || !guestInfo.soDT) {
         return res.send("Vui lòng nhập tên và số điện thoại!");
      }
    }
    
    const soLuong = parseInt(req.body.soLuong) || 1;
    if (soLuong <= 0 || soLuong > 100) {
      return res.send("Số lượng mua không hợp lệ (Chỉ được mua từ 1 - 100) hoặc có dấu hiệu hack!");
    }

    // Khách xác định mua -> Giảm số lượng tồn kho (Atomic update)
    const sanPham = await noiThat.findOneAndUpdate(
      { _id: noithatId, tonKho: { $gte: soLuong } },
      { $inc: { tonKho: -soLuong } },
      { new: true }
    );

    if(!sanPham) {
      const sp = await noiThat.findById(noithatId);
      const conLai = sp ? sp.tonKho : 0;
      return res.send(`
        <html><head><meta charset="utf-8"><title>Không đủ hàng</title><link href="/bootstrap/bootstrap.min.css" rel="stylesheet" /></head>
        <body class="bg-light d-flex align-items-center justify-content-center vh-100">
          <div class="text-center p-5 bg-white shadow rounded-4" style="max-width: 600px;">
            <h1 class="text-danger mb-3">⚠️ Không đủ số lượng!</h1>
            <p class="lead">Sản phẩm chỉ còn <strong>${conLai}</strong> sản phẩm trong kho, không đủ cho yêu cầu <strong>${soLuong}</strong> của bạn.</p>
            <p class="text-muted">Vui lòng giảm số lượng hoặc liên hệ trực tiếp người bán để đặt thêm.</p>
            <div class="d-flex gap-3 justify-content-center mt-4">
              <a href="/product/${noithatId}" class="btn btn-outline-dark rounded-pill px-4">⬅ Quay lại sản phẩm</a>
              <a href="/contact" class="btn btn-warning rounded-pill px-4">📞 Liên hệ người bán</a>
            </div>
          </div>
        </body></html>
      `);
    }

    let tongTien = sanPham.gia * soLuong;
    let giamGia = 0;

    // Áp dụng giảm giá khi mua số lượng lớn
    if (soLuong >= 10) {
      giamGia = 20; // Giảm 20% cho đơn từ 10 sản phẩm trở lên
    } else if (soLuong >= 5) {
      giamGia = 10; // Giảm 10% cho đơn từ 5 đến 9 sản phẩm
    }

    if (giamGia > 0) {
      tongTien = tongTien - (tongTien * giamGia) / 100;
    }

    // Áp dụng mã Voucher giảm giá nếu khách chọn
    const voucherCode = req.body.voucherCode ? req.body.voucherCode.trim().toUpperCase() : "";
    if (voucherCode) {
      const vInfo = calculateVoucherDiscount(voucherCode, tongTien);
      if (vInfo.discount > 0) {
        tongTien = Math.max(0, tongTien - vInfo.discount);
      }
    }

    await donHang.create({
      thanhVienId: thanhVienId,
      guestInfo: guestInfo,
      noithatId: noithatId,
      soLuong: soLuong,
      tongTien: tongTien,
      giamGia: giamGia,
      maGiamGia: voucherCode
    });

    // Gửi thông báo cho Admin nếu tồn kho thấp sau khi mua
    if (sanPham.tonKho <= 5) {
      const admins = await thanhVien.find({ vaiTro: "admin" });
      for (const admin of admins) {
        await ThongBao.create({
          thanhVienId: admin._id,
          noiDung: `⚠️ Cảnh báo tồn kho: "${sanPham.tenNoiThat}" chỉ còn ${sanPham.tonKho} sản phẩm!${sanPham.tonKho === 0 ? ' ĐÃ HẾT HÀNG!' : ''}`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
    }

    if (thanhVienId) {
      res.redirect("/my-orders");
    } else {
      res.send(`
        <html>
        <head><meta charset="utf-8"><title>Đặt hàng thành công</title><link href="/bootstrap/bootstrap.min.css" rel="stylesheet" /></head>
        <body class="bg-light d-flex align-items-center justify-content-center vh-100">
          <div class="text-center p-5 bg-white shadow rounded-4">
            <h1 class="text-success mb-3">🎉 Đặt hàng thành công!</h1>
            <p class="lead">Cảm ơn <b>${guestInfo.hoTen}</b> đã mua sắm. Chúng tôi sẽ giao hàng đến: <b>${guestInfo.diaChi}</b>.</p>
            <a href="/dashboard" class="btn btn-success mt-3 rounded-pill px-4">Tiếp tục mua sắm</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.log(err);
    res.send("Lỗi đặt hàng");
  }
});

app.get("/my-orders", checkLogin, async (req, res) => {
  try {
    const dsDonHang = await donHang
      .find({ thanhVienId: req.session.user._id })
      .populate("noithatId");

    res.render("customer/myorders", {
      user: req.session.user,
      dsDonHang: dsDonHang,
    });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải đơn hàng");
  }
});

// --- BẮT ĐẦU TRẢ HÀNG / HOÀN TIỀN (NGƯỜI MUA) ---
app.get("/returns", checkLogin, async (req, res) => {
  try {
    const statusFilter = req.query.status || "all";
    let query = { thanhVienId: req.session.user._id };

    if (statusFilter === "cho_xu_ly") {
      query.trangThai = { $in: ["da_gui_yeu_cau", "cho_phe_duyet"] };
    } else if (statusFilter === "dang_hoan") {
      query.trangThai = { $in: ["dong_goi_gui_tra", "van_chuyen_hang_hoan"] };
    } else if (statusFilter === "da_hoan_tien") {
      query.trangThai = "da_nhan_tien_hoan";
    } else if (statusFilter === "tu_choi") {
      query.trangThai = { $in: ["tu_choi", "khieu_nai"] };
    }

    const dsTraHang = await TraHang.find(query)
      .populate({
        path: "donHangId",
        populate: { path: "noithatId" }
      })
      .sort({ ngayTao: -1 });

    res.render("customer/returns", {
      dsTraHang,
      statusFilter,
      user: req.session.user
    });
  } catch (err) {
    console.error("Lỗi tải danh sách trả hàng:", err);
    res.send("Lỗi tải danh sách trả hàng/hoàn tiền");
  }
});

app.get("/returns/create/:orderId", checkLogin, async (req, res) => {
  try {
    const order = await donHang.findOne({
      _id: req.params.orderId,
      thanhVienId: req.session.user._id
    }).populate("noithatId");

    if (!order) {
      req.flash("error", "Đơn hàng không tồn tại hoặc bạn không có quyền thao tác.");
      return res.redirect("/my-orders");
    }

    // Kiểm tra xem đơn hàng đã có yêu cầu hoàn trả chưa
    const existing = await TraHang.findOne({ donHangId: order._id });
    if (existing) {
      return res.redirect(`/returns/${existing._id}`);
    }

    res.render("customer/create-return", {
      order,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.redirect("/my-orders");
  }
});

app.post("/returns/create/:orderId", checkLogin, upload.array("evidence", 5), async (req, res) => {
  try {
    const order = await donHang.findOne({
      _id: req.params.orderId,
      thanhVienId: req.session.user._id
    }).populate("noithatId");

    if (!order) {
      req.flash("error", "Đơn hàng không tồn tại!");
      return res.redirect("/my-orders");
    }

    const bangChung = (req.files || []).map(f => "/images/" + f.filename);
    const maYeuCau = "TH" + Date.now().toString().slice(-6) + Math.floor(1000 + Math.random() * 9000);

    const newReturn = await TraHang.create({
      maYeuCau: maYeuCau,
      donHangId: order._id,
      thanhVienId: req.session.user._id,
      lyDo: req.body.lyDo || "Khác",
      chiTietLyDo: req.body.chiTietLyDo || "",
      bangChungHinhAnh: bangChung,
      soTienHoan: order.tongTien,
      phuongThucHoanTien: "Chuyển khoản ngân hàng",
      thongTinNganHang: {
        tenNganHang: req.body.tenNganHang || "",
        soTaiKhoan: req.body.soTaiKhoan || "",
        chuTaiKhoan: req.body.chuTaiKhoan || ""
      },
      hinhThucGuiHang: req.body.hinhThucGuiHang || "lay_tan_noi",
      diaChiLayHang: req.body.diaChiLayHang || (order.guestInfo ? order.guestInfo.diaChi : ""),
      trangThai: "da_gui_yeu_cau"
    });

    // Cập nhật trạng thái đơn hàng
    order.trangThai = "Yêu cầu trả hàng";
    await order.save();

    // Thông báo cho Admin
    const admins = await thanhVien.find({ vaiTro: "admin" });
    for (const admin of admins) {
      await ThongBao.create({
        thanhVienId: admin._id,
        noiDung: `⚠️ Yêu cầu Trả hàng mới #${maYeuCau}: Khách yêu cầu hoàn tiền cho "${order.noithatId ? order.noithatId.tenNoiThat : 'sản phẩm'}" (${order.tongTien.toLocaleString('vi-VN')}đ).`,
        loai: "thong_bao_chung",
        trangThai: "chua_doc"
      });
    }

    req.flash("success", "Đã gửi yêu cầu trả hàng / hoàn tiền thành công! Người bán sẽ phản hồi trong 48h.");
    res.redirect(`/returns/${newReturn._id}`);
  } catch (err) {
    console.error("Lỗi tạo yêu cầu trả hàng:", err);
    req.flash("error", "Lỗi khi gửi yêu cầu trả hàng. Vui lòng thử lại!");
    res.redirect("/my-orders");
  }
});

app.get("/returns/:id", checkLogin, async (req, res) => {
  try {
    const returnItem = await TraHang.findOne({
      _id: req.params.id,
      thanhVienId: req.session.user._id
    }).populate({
      path: "donHangId",
      populate: { path: "noithatId" }
    });

    if (!returnItem) {
      req.flash("error", "Yêu cầu trả hàng không tồn tại!");
      return res.redirect("/returns");
    }

    res.render("customer/return-detail", {
      returnItem,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.redirect("/returns");
  }
});

app.post("/returns/cancel/:id", checkLogin, async (req, res) => {
  try {
    const returnItem = await TraHang.findOne({
      _id: req.params.id,
      thanhVienId: req.session.user._id
    });

    if (returnItem && (returnItem.trangThai === "da_gui_yeu_cau" || returnItem.trangThai === "cho_phe_duyet")) {
      await donHang.findByIdAndUpdate(returnItem.donHangId, { trangThai: "Hoàn thành" });
      await TraHang.findByIdAndDelete(returnItem._id);
      req.flash("success", "Đã hủy yêu cầu trả hàng thành công.");
    }
    res.redirect("/returns");
  } catch (err) {
    console.error(err);
    res.redirect("/returns");
  }
});
// --- KẾT THÚC TRẢ HÀNG / HOÀN TIỀN (NGƯỜI MUA) ---
 
app.get("/order-list", checkAdmin, async (req, res) => {
  try {
    const statusFilter = req.query.status || "";
    let filter = {};
    if (statusFilter) {
      filter.trangThai = statusFilter;
    }
 
    const dsDonHang = await donHang
      .find(filter)
      .sort({ ngayDat: -1 })
      .populate("thanhVienId")
      .populate("noithatId");
 
    res.render("admin/orderlist", { dsDonHang, statusFilter });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải danh sách đơn hàng");
  }
});
 
// --- TRANG PROFILE ---
app.get("/profile", checkLogin, async (req, res) => {
  try {
    const profileUser = await thanhVien.findById(req.session.user._id);
    if (!profileUser) return res.redirect("/login");
    res.render("customer/profile", { profileUser });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải trang profile");
  }
});

app.post("/profile/update", checkLogin, async (req, res) => {
  try {
    const { hoTen, soDT, diaChi } = req.body;
    await thanhVien.findByIdAndUpdate(req.session.user._id, { hoTen, soDT, diaChi });
    // Cập nhật session
    const updatedUser = await thanhVien.findById(req.session.user._id);
    req.session.user = updatedUser;
    req.flash("success", "Cập nhật thông tin thành công!");
    res.redirect("/profile");
  } catch (err) {
    req.flash("error", "Lỗi cập nhật: " + err.message);
    res.redirect("/profile");
  }
});

app.post("/profile/change-password", checkLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      req.flash("error", "Mật khẩu mới và xác nhận không khớp!");
      return res.redirect("/profile");
    }
    if (newPassword.length < 6) {
      req.flash("error", "Mật khẩu mới phải có ít nhất 6 ký tự!");
      return res.redirect("/profile");
    }
    
    const user = await thanhVien.findById(req.session.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.matKhau);
    if (!isMatch) {
      req.flash("error", "Mật khẩu hiện tại không đúng!");
      return res.redirect("/profile");
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await thanhVien.findByIdAndUpdate(req.session.user._id, { matKhau: hashedPassword });
    
    req.flash("success", "Đổi mật khẩu thành công!");
    res.redirect("/profile");
  } catch (err) {
    req.flash("error", "Lỗi đổi mật khẩu: " + err.message);
    res.redirect("/profile");
  }
});

app.post("/cancel-order/:id", checkLogin, async (req, res) => {
  try {
    const donHangId = req.params.id;
    // Tìm đơn hàng trước khi hủy và populate sản phẩm để lấy tên
    const order = await donHang.findOne({
      _id: donHangId,
      thanhVienId: req.session.user._id,
      trangThai: { $nin: ["Đã hủy", "Hoàn thành"] } // Chỉ cho phép hủy đơn chưa hủy hoặc chưa hoàn thành
    }).populate("noithatId");
    
    if (!order) {
      req.flash("error", "Không tìm thấy đơn hàng hoặc đơn hàng này không thể hủy/yêu cầu hủy.");
      return res.redirect("/my-orders");
    }
    
    const tenSP = order.noithatId ? order.noithatId.tenNoiThat : "Sản phẩm đã xóa";
    const admins = await thanhVien.find({ vaiTro: "admin" });
    const orderIdShort = order._id.toString().substring(18);

    if (order.trangThai === "Chờ xác nhận") {
      // 1. Trạng thái "Chờ xác nhận" -> HỦY TRỰC TIẾP
      // Hoàn kho sản phẩm ngay lập tức
      await noiThat.findByIdAndUpdate(order.noithatId, { $inc: { tonKho: order.soLuong } });
      
      // Cập nhật trạng thái thành Đã hủy
      order.trangThai = "Đã hủy";
      await order.save();
      
      // Báo cho Admin: Đã hủy trực tiếp
      for (const admin of admins) {
        await ThongBao.create({
          donHangId: order._id,
          thanhVienId: admin._id,
          noiDung: `Khách hàng "${req.session.user.hoTen}" đã HỦY đơn hàng #${orderIdShort} ("${tenSP}" - SL: ${order.soLuong}). Kho hàng đã được tự động hoàn trả.`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
      
      req.flash("success", "Hủy đơn hàng thành công!");
    } else {
      // 2. Trạng thái "Đang chuẩn bị hàng" hoặc "Đang giao" -> GỬI YÊU CẦU HỦY CHO ADMIN
      if (order.trangThai === "Yêu cầu hủy") {
        req.flash("error", "Đơn hàng này đang chờ Admin duyệt yêu cầu hủy.");
        return res.redirect("/my-orders");
      }

      const trangThaiGoc = order.trangThai;
      order.trangThai = "Yêu cầu hủy";
      await order.save();

      // Báo cho Admin: Khách yêu cầu hủy đơn hàng
      for (const admin of admins) {
        await ThongBao.create({
          donHangId: order._id,
          thanhVienId: admin._id,
          noiDung: `Khách hàng "${req.session.user.hoTen}" YÊU CẦU HỦY đơn hàng #${orderIdShort} ("${tenSP}" - SL: ${order.soLuong}). Trạng thái hiện tại: "${trangThaiGoc}".`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }

      req.flash("success", "Đã gửi yêu cầu hủy đơn hàng tới Admin. Vui lòng chờ duyệt!");
    }
    
    res.redirect("/my-orders");
  } catch (err) {
    console.log(err);
    req.flash("error", "Đã xảy ra lỗi khi xử lý yêu cầu hủy đơn hàng.");
    res.redirect("/my-orders");
  }
});

// Admin cập nhật trạng thái đơn hàng
app.post("/update-order-status/:id", checkAdmin, async (req, res) => {
  try {
    const order = await donHang.findById(req.params.id);
    if (!order) return res.send("Không tìm thấy đơn hàng");
    
    const oldStatus = order.trangThai;
    const newStatus = req.body.trangThai;
    
    // Hoàn kho nếu chuyển sang "Đã hủy" (và trước đó chưa hủy)
    if (newStatus === "Đã hủy" && oldStatus !== "Đã hủy") {
      await noiThat.findByIdAndUpdate(order.noithatId, { $inc: { tonKho: order.soLuong } });
    }
    // Trừ kho lại nếu phục hồi từ "Đã hủy" sang trạng thái khác
    if (oldStatus === "Đã hủy" && newStatus !== "Đã hủy") {
      await noiThat.findByIdAndUpdate(order.noithatId, { $inc: { tonKho: -order.soLuong } });
    }
    
    await donHang.findByIdAndUpdate(req.params.id, { trangThai: newStatus });
    // Quay lại trang gốc (admin hoặc order-list)
    const referer = req.get("Referer") || "/order-list";
    res.redirect(referer);
  } catch (err) {
    res.send("Lỗi cập nhật trạng thái: " + err.message);
  }
});

// --- BẮT ĐẦU KÊNH NGƯỜI BÁN (QUẢN LÝ TRẢ HÀNG / HOÀN TIỀN / HỦY ĐƠN) ---
app.get("/admin/returns", checkAdmin, async (req, res) => {
  try {
    const activeTab = req.query.tab || "returns";
    const priorityFilter = req.query.filter || "";

    // 1. Danh sách Trả hàng / Hoàn tiền
    let returnQuery = {};
    const now = new Date();
    if (priorityFilter === "urgent") {
      const urgentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      returnQuery = {
        trangThai: { $in: ["da_gui_yeu_cau", "cho_phe_duyet"] },
        hanXuLy: { $lte: urgentDeadline }
      };
    } else if (priorityFilter === "wait_goods") {
      returnQuery = { trangThai: { $in: ["dong_goi_gui_tra", "van_chuyen_hang_hoan"] } };
    } else if (priorityFilter === "wait_refund") {
      returnQuery = { trangThai: "van_chuyen_hang_hoan" };
    } else if (priorityFilter === "done") {
      returnQuery = { trangThai: { $in: ["da_nhan_tien_hoan", "tu_choi"] } };
    }

    const dsTraHang = await TraHang.find(returnQuery)
      .populate({
        path: "donHangId",
        populate: { path: "noithatId" }
      })
      .populate("thanhVienId")
      .sort({ ngayTao: -1 });

    // 2. Danh sách Đơn hủy
    const dsDonHuy = await donHang.find({
      trangThai: { $in: ["Yêu cầu hủy", "Đã hủy"] }
    }).populate("noithatId").populate("thanhVienId").sort({ ngayDat: -1 });

    // 3. Danh sách Đơn giao hàng không thành công
    const dsDonGiaoThatBai = await donHang.find({
      trangThai: "Giao không thành công"
    }).populate("noithatId").populate("thanhVienId").sort({ ngayDat: -1 });

    // Đếm các thao tác quan trọng
    const urgentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const countUrgent = await TraHang.countDocuments({
      trangThai: { $in: ["da_gui_yeu_cau", "cho_phe_duyet"] },
      hanXuLy: { $lte: urgentDeadline }
    });
    const countWaitGoods = await TraHang.countDocuments({
      trangThai: { $in: ["dong_goi_gui_tra", "van_chuyen_hang_hoan"] }
    });
    const countWaitRefund = await TraHang.countDocuments({
      trangThai: "van_chuyen_hang_hoan"
    });
    const countDone = await TraHang.countDocuments({
      trangThai: { $in: ["da_nhan_tien_hoan", "tu_choi"] }
    });

    res.render("admin/returns", {
      activeTab,
      priorityFilter,
      dsTraHang,
      dsDonHuy,
      dsDonGiaoThatBai,
      countUrgent,
      countWaitGoods,
      countWaitRefund,
      countDone,
      user: req.session.adminUser || req.session.user
    });
  } catch (err) {
    console.error("Lỗi kênh người bán:", err);
    res.send("Lỗi tải trang quản lý Kênh Người Bán");
  }
});

// Phê duyệt trả hàng & Cấp mã vận đơn mới
app.post("/admin/returns/approve/:id", checkAdmin, async (req, res) => {
  try {
    const maVanDonTra = req.body.maVanDonTra || "SPX-RT-" + Date.now().toString().slice(-8);
    const donViVanChuyen = req.body.donViVanChuyen || "Shopee Xpress";
    const hinhThucGuiHang = req.body.hinhThucGuiHang || "lay_tan_noi";
    const ghiChuNguoiBan = req.body.ghiChuNguoiBan || "";

    const returnItem = await TraHang.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: "dong_goi_gui_tra",
        maVanDonTra: maVanDonTra,
        donViVanChuyen: donViVanChuyen,
        hinhThucGuiHang: hinhThucGuiHang,
        ghiChuNguoiBan: ghiChuNguoiBan,
        ngayCapNhat: new Date()
      },
      { new: true }
    );

    if (returnItem) {
      await donHang.findByIdAndUpdate(returnItem.donHangId, { trangThai: "Đang trả hàng" });
      
      // Báo cho khách
      if (returnItem.thanhVienId) {
        await ThongBao.create({
          thanhVienId: returnItem.thanhVienId,
          noiDung: `✅ Người bán đã đồng ý yêu cầu trả hàng #${returnItem.maYeuCau}. Mã vận đơn gửi hàng: ${maVanDonTra}. Vui lòng đóng gói hàng trả.`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
    }

    req.flash("success", "Đã duyệt yêu cầu trả hàng và cấp mã vận đơn thành công!");
    res.redirect("/admin/returns?tab=returns");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=returns");
  }
});

// Từ chối trả hàng
app.post("/admin/returns/reject/:id", checkAdmin, async (req, res) => {
  try {
    const returnItem = await TraHang.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: "tu_choi",
        ghiChuNguoiBan: req.body.ghiChuNguoiBan || "Không đáp ứng chính sách đổi trả",
        ngayCapNhat: new Date()
      },
      { new: true }
    );

    if (returnItem) {
      await donHang.findByIdAndUpdate(returnItem.donHangId, { trangThai: "Hoàn thành" });
      if (returnItem.thanhVienId) {
        await ThongBao.create({
          thanhVienId: returnItem.thanhVienId,
          noiDung: `❌ Yêu cầu trả hàng #${returnItem.maYeuCau} đã bị từ chối: "${returnItem.ghiChuNguoiBan}".`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
    }

    req.flash("success", "Đã từ chối yêu cầu trả hàng.");
    res.redirect("/admin/returns?tab=returns");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=returns");
  }
});

// Chuyển sang đang vận chuyển hàng hoàn
app.post("/admin/returns/mark-shipped/:id", checkAdmin, async (req, res) => {
  try {
    await TraHang.findByIdAndUpdate(req.params.id, {
      trangThai: "van_chuyen_hang_hoan",
      ngayCapNhat: new Date()
    });
    req.flash("success", "Đã cập nhật trạng thái: Đang vận chuyển hàng hoàn về kho.");
    res.redirect("/admin/returns?tab=returns");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=returns");
  }
});

// Xác nhận đã nhận hàng hoàn & hoàn tất hoàn tiền
app.post("/admin/returns/complete/:id", checkAdmin, async (req, res) => {
  try {
    const returnItem = await TraHang.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: "da_nhan_tien_hoan",
        ngayCapNhat: new Date()
      },
      { new: true }
    ).populate("donHangId");

    if (returnItem && returnItem.donHangId) {
      await donHang.findByIdAndUpdate(returnItem.donHangId._id, { trangThai: "Đã hoàn tiền" });
      
      // Tự động nhập kho lại cho sản phẩm
      if (returnItem.donHangId.noithatId) {
        await noiThat.findByIdAndUpdate(returnItem.donHangId.noithatId, {
          $inc: { tonKho: returnItem.donHangId.soLuong }
        });
      }

      if (returnItem.thanhVienId) {
        await ThongBao.create({
          thanhVienId: returnItem.thanhVienId,
          noiDung: `🎉 Người bán đã nhận hàng và hoàn tất thanh toán tiền hoàn ${returnItem.soTienHoan.toLocaleString('vi-VN')}đ cho yêu cầu #${returnItem.maYeuCau}.`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
    }

    req.flash("success", "Đã xác nhận nhận hàng và hoàn tiền thành công! Hàng đã được tự động cộng lại vào tồn kho.");
    res.redirect("/admin/returns?tab=returns");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=returns");
  }
});

// Khiếu nại sàn
app.post("/admin/returns/dispute/:id", checkAdmin, async (req, res) => {
  try {
    await TraHang.findByIdAndUpdate(req.params.id, {
      trangThai: "khieu_nai",
      ghiChuNguoiBan: req.body.ghiChuNguoiBan || "Đã gửi khiếu nại lên Sàn can thiệp",
      ngayCapNhat: new Date()
    });
    req.flash("success", "Đã gửi khiếu nại lên Sàn thương mại điện tử để phân xử.");
    res.redirect("/admin/returns?tab=returns");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=returns");
  }
});

// Duyệt hủy đơn và hoàn kho
app.post("/admin/orders/cancel-approve/:id", checkAdmin, async (req, res) => {
  try {
    const order = await donHang.findById(req.params.id);
    if (order && order.trangThai === "Yêu cầu hủy") {
      order.trangThai = "Đã hủy";
      await order.save();

      // Cộng lại tồn kho
      await noiThat.findByIdAndUpdate(order.noithatId, {
        $inc: { tonKho: order.soLuong }
      });

      if (order.thanhVienId) {
        await ThongBao.create({
          thanhVienId: order.thanhVienId,
          noiDung: `Đơn hàng #${order._id} đã được người bán chấp thuận hủy đơn.`,
          loai: "thong_bao_chung",
          trangThai: "chua_doc"
        });
      }
      req.flash("success", `Đã duyệt hủy đơn và hoàn lại ${order.soLuong} sản phẩm vào tồn kho!`);
    }
    res.redirect("/admin/returns?tab=cancels");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=cancels");
  }
});

// Nhập lại kho cho đơn giao không thành công
app.post("/admin/orders/restock/:id", checkAdmin, async (req, res) => {
  try {
    const order = await donHang.findById(req.params.id);
    if (order) {
      order.trangThai = "Đã hủy";
      await order.save();

      // Cộng lại tồn kho
      await noiThat.findByIdAndUpdate(order.noithatId, {
        $inc: { tonKho: order.soLuong }
      });

      req.flash("success", `Đã nhập hàng hoàn về kho thành công (+${order.soLuong} tồn kho)!`);
    }
    res.redirect("/admin/returns?tab=failed");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/returns?tab=failed");
  }
});
// --- KẾT THÚC KÊNH NGƯỜI BÁN (QUẢN LÝ TRẢ HÀNG / HOÀN TIỀN / HỦY ĐƠN) ---

app.get("/members", checkAdmin, async (req, res) => {
  try {
    const data = await thanhVien.find().lean();
    // Đếm số đơn hàng cho từng thành viên
    for (let member of data) {
      member.soLanMua = await donHang.countDocuments({ thanhVienId: member._id });
    }
    res.render("members/Select", { dsThanhVien: data });
  } catch (err) {
    console.error(err);
    res.send("Lỗi tải danh sách thành viên");
  }
});
app.get("/members/add", (req, res) => res.render("members/Add", { error: null }));
app.post("/members/add", async (req, res) => {
  try {
    const { email, soDT, matKhau, hoTen, diaChi } = req.body;
    
    // Validate Regex
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.render("members/Add", { error: "Email không đúng định dạng!", formData: req.body });
    }
    if (matKhau && matKhau.length < 6) {
      return res.render("members/Add", { error: "Mật khẩu quá yếu (phải từ 6 ký tự)!", formData: req.body });
    }
    if (soDT && soDT.length > 10) {
      return res.render("members/Add", { error: "Số điện thoại không được vượt quá 10 chữ số!", formData: req.body });
    }
    const htmlRegex = /<[^>]*>/;
    if (htmlRegex.test(hoTen) || htmlRegex.test(diaChi)) {
      return res.render("members/Add", { error: "Dữ liệu chứa ký tự không hợp lệ (HTML/Script)!", formData: req.body });
    }

    // Tìm xem đã có ai dùng email hoặc số điện thoại này chưa
    const existingUser = await thanhVien.findOne({
      $or: [{ email: email }, { soDT: soDT }]
    });

    if (existingUser) {
      return res.render("members/Add", { error: "Bạn đã đăng ký rồi! Email hoặc Số điện thoại này đã được sử dụng.", formData: req.body });
    }
    // Hash mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    req.body.matKhau = await bcrypt.hash(req.body.matKhau, salt);
    await thanhVien.create(req.body);
    res.redirect("/login");
  } catch (err) {
    res.send("Lỗi thêm thành viên: " + err.message);
  }
});
app.get("/members/update/:id", checkAdmin, async (req, res) => {
  try {
    const data = await thanhVien.findById(req.params.id);
    res.render("members/Update", { thanhVien: data });
  } catch (err) {
    res.send("Lỗi tải form sửa");
  }
});
app.post("/members/update/:id", checkAdmin, async (req, res) => {
  try {
    // Kiểm tra không cho phép sửa thành Email của người khác
    if (req.body.email) {
      const duplicate = await thanhVien.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.send(`Lỗi: Email "${req.body.email}" đã được người khác sử dụng! Vui lòng chọn Email khác.`);
      }
    }
    
    // Hash mật khẩu mới nếu được thay đổi
    if (req.body.matKhau && req.body.matKhau.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      req.body.matKhau = await bcrypt.hash(req.body.matKhau, salt);
    } else {
      // Không thay đổi mật khẩu nếu để trống
      delete req.body.matKhau;
    }
    
    await thanhVien.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/members");
  } catch (err) {
    res.send("Lỗi cập nhật: " + err.message);
  }
});


app.get("/categories", checkAdmin, async (req, res) => {
  try {
    const data = await loaiNoiThat.find();
    res.render("categories/Select", { loaiNoiThat: data });
  } catch (err) {
    res.send("Lỗi tải danh mục");
  }
});
app.get("/categories/add", checkAdmin, (req, res) => res.render("categories/Add"));
app.post("/categories/add", checkAdmin, async (req, res) => {
  try {
    await loaiNoiThat.create(req.body);
    req.flash("success", "Thêm danh mục thành công!");
    res.redirect("/categories");
  } catch (err) {
    res.send("Lỗi thêm danh mục");
  }
});
app.get("/categories/update/:id", checkAdmin, async (req, res) => {
  try {
    const data = await loaiNoiThat.findById(req.params.id);
    res.render("categories/Update", { loaiNoiThat: data });
  } catch (err) {
    res.send("Lỗi tải form sửa");
  }
});
app.post("/categories/update/:id", checkAdmin, async (req, res) => {
  try {
    await loaiNoiThat.findByIdAndUpdate(req.params.id, req.body);
    req.flash("success", "Cập nhật danh mục thành công!");
    res.redirect("/categories");
  } catch (err) {
    res.send("Lỗi cập nhật");
  }
});
app.post("/categories/delete/:id", checkAdmin, async (req, res) => {
  try {
    await loaiNoiThat.findByIdAndDelete(req.params.id);
    res.redirect("/categories");
  } catch (err) {
    res.send("Lỗi xóa");
  }
});

app.get("/products", checkAdmin, async (req, res) => {
  try {
    const isLowStock = req.query.filter === "low_stock";
    const data = await noiThat.find(isLowStock ? { tonKho: { $lte: 5 } } : {});
    res.render("products/Select", { noiThat: data, isLowStock });
  } catch (err) {
    res.send("Lỗi tải danh sách sản phẩm");
  }
});
app.get("/products/add", checkAdmin, async (req, res) => {
  try {
    const data = await loaiNoiThat.find();
    res.render("products/Add", { loaiNoiThatList: data });
  } catch (err) {
    res.send("Lỗi tải form thêm sản phẩm");
  }
});
app.post("/products/add", checkAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    if (req.file) {
      req.body.hinhAnh = "/images/" + req.file.filename;
    }
    await noiThat.create(req.body);
    req.flash("success", "Thêm sản phẩm thành công!");
    res.redirect("/products");
  } catch (err) {
    req.flash("error", "Lỗi thêm sản phẩm: " + err.message);
  }
});
app.get("/products/update/:id", checkAdmin, async (req, res) => {
  try {
    const product = await noiThat.findById(req.params.id);
    const loaiNoiThatList = await loaiNoiThat.find();
    res.render("products/Update", { noiThat: product, loaiNoiThatList: loaiNoiThatList });
  } catch (err) {
    res.send("Lỗi tải form sửa sản phẩm");
  }
});
app.post("/products/update/:id", checkAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    if (req.file) {
      req.body.hinhAnh = "/images/" + req.file.filename;
    }
    await noiThat.findByIdAndUpdate(req.params.id, req.body);
    req.flash("success", "Cập nhật sản phẩm thành công!");
    res.redirect("/products");
  } catch (err) {
    res.send("Lỗi cập nhật sản phẩm: " + err.message);
  }
});
app.post("/products/delete/:id", checkAdmin, async (req, res) => {
  try {
    await noiThat.findByIdAndDelete(req.params.id);
    req.flash("success", "Xóa sản phẩm thành công!");
    res.redirect("/products");
  } catch (err) {
    res.send("Lỗi xóa sản phẩm");
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ ngayTao: -1 });
    res.render("store/reviews", { reviews: reviews, user: req.session.user || null });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải trang đánh giá");
  }
});

app.post("/reviews/add", async (req, res) => {
  try {
    // Escape HTML trước khi lưu để chống XSS (Slide 12)
    if (req.body.chiTiet) {
      req.body.chiTiet = escapeHtml(req.body.chiTiet);
    }
    
    await Review.create(req.body);
    res.redirect("/reviews");
  } catch (err) {
    console.log(err);
    res.send("Lỗi gửi đánh giá");
  }
});

// --- QUẢN LÝ ĐÁNH GIÁ (Admin) ---
app.get("/admin/reviews", checkAdmin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ ngayTao: -1 })
      .populate("noithatId");
    res.render("admin/Reviews", { reviews });
  } catch (err) {
    res.status(500).send("Lỗi tải danh sách đánh giá");
  }
});

// --- QUẢN LÝ HỆ THỐNG (Super Admin) ---
app.get("/admin/settings", checkAdmin, async (req, res) => {
  try {
    const settings = await HeThong.find({});
    res.render("admin/Settings", { settingsList: settings });
  } catch (err) {
    res.status(500).send("Lỗi tải trang cấu hình");
  }
});

app.post("/admin/settings", checkAdmin, async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const key in updates) {
      await HeThong.findOneAndUpdate({ key: key }, { value: updates[key] });
    }
    res.redirect("/admin/settings?status=success");
  } catch (err) {
    res.status(500).send("Lỗi cập nhật cấu hình");
  }
});


app.post("/members/delete/:id", checkAdmin, async (req, res) => {
  try {
    // Không cho phép xóa chính mình
    if (req.params.id === req.session.user._id) {
      return res.status(400).send("Bạn không thể xóa chính tài khoản đang đăng nhập!");
    }
    await thanhVien.findByIdAndDelete(req.params.id);
    res.redirect("/members");
  } catch (err) {
    res.status(500).send("Lỗi xóa thành viên");
  }
});

app.post("/members/change-role/:id", checkAdmin, async (req, res) => {
  try {
    const userToUpdate = await thanhVien.findById(req.params.id);
    const newRole = userToUpdate.vaiTro === "admin" ? "user" : "admin";
    await thanhVien.findByIdAndUpdate(req.params.id, { vaiTro: newRole });
    res.redirect("/members");
  } catch (err) {
    res.status(500).send("Lỗi thay đổi quyền hạn");
  }
});

// --- QUẢN LÝ ĐÁNH GIÁ ---
app.post("/reviews/delete/:id", checkAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.redirect("back"); // Quay lại trang cũ (có thể là trang sản phẩm hoặc trang quản lý)
  } catch (err) {
    res.status(500).send("Lỗi xóa đánh giá");
  }
});

// --- HỆ THỐNG THÔNG BÁO ---
// Admin gửi thông báo hỏi khách đã nhận hàng chưa
app.post("/admin/send-notification/:orderId", checkAdmin, async (req, res) => {
  try {
    const order = await donHang.findById(req.params.orderId).populate("noithatId");
    if (!order) return res.send("Đơn hàng không tồn tại");
    if (!order.thanhVienId) return res.send("Đơn hàng của khách vãng lai — không thể gửi thông báo.");

    // Kiểm tra đã gửi thông báo cho đơn này chưa
    const existing = await ThongBao.findOne({ donHangId: order._id, loai: "xac_nhan_nhan_hang" });
    if (existing) {
      const referer = req.get("Referer") || "/order-list";
      return res.redirect(referer);
    }

    const tenSP = order.noithatId ? order.noithatId.tenNoiThat : "sản phẩm";
    await ThongBao.create({
      donHangId: order._id,
      thanhVienId: order.thanhVienId,
      noiDung: `Xin chào! Đơn hàng "${tenSP}" (x${order.soLuong}) của bạn đã được giao. Bạn đã nhận được hàng chưa?`,
      loai: "xac_nhan_nhan_hang"
    });

    const referer = req.get("Referer") || "/order-list";
    res.redirect(referer);
  } catch (err) {
    console.log(err);
    res.send("Lỗi gửi thông báo");
  }
});

// Khách xem danh sách thông báo
app.get("/notifications", checkLogin, async (req, res) => {
  try {
    const notifications = await ThongBao.find({ thanhVienId: req.session.user._id })
      .sort({ ngayGui: -1 })
      .populate({
        path: "donHangId",
        populate: { path: "noithatId" }
      });

    // Đánh dấu tất cả thông báo chưa đọc thành đã đọc
    await ThongBao.updateMany(
      { thanhVienId: req.session.user._id, trangThai: "chua_doc" },
      { trangThai: "da_doc" }
    );

    res.render("customer/notifications", { notifications });
  } catch (err) {
    console.log(err);
    res.send("Lỗi tải thông báo");
  }
});

// Khách xác nhận ĐÃ nhận hàng
app.post("/notifications/confirm/:id", checkLogin, async (req, res) => {
  try {
    const notification = await ThongBao.findOne({
      _id: req.params.id,
      thanhVienId: req.session.user._id
    });
    if (!notification) return res.send("Thông báo không tồn tại");

    notification.trangThai = "da_xac_nhan";
    notification.ngayPhanHoi = new Date();
    await notification.save();

    // Tự động chuyển đơn hàng sang Hoàn thành
    await donHang.findByIdAndUpdate(notification.donHangId, { trangThai: "Hoàn thành" });

    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    res.send("Lỗi xác nhận");
  }
});

// Khách báo CHƯA nhận hàng
app.post("/notifications/not-received/:id", checkLogin, async (req, res) => {
  try {
    const notification = await ThongBao.findOne({
      _id: req.params.id,
      thanhVienId: req.session.user._id
    });
    if (!notification) return res.send("Thông báo không tồn tại");

    notification.trangThai = "chua_nhan";
    notification.ngayPhanHoi = new Date();
    await notification.save();

    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    res.send("Lỗi phản hồi");
  }
});

// --- TRANG 404 ---
app.use((req, res) => {
  res.status(404).send(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>404 - Không tìm thấy trang</title>
      <link href="/bootstrap/bootstrap.min.css" rel="stylesheet" />
      <link href="/css/style.css" rel="stylesheet" />
    </head>
    <body class="d-flex align-items-center justify-content-center vh-100" style="background-color: #fcfcfc;">
      <div class="text-center p-5">
        <h1 class="playfair" style="font-size: 8rem; color: var(--secondary-color);">404</h1>
        <h3 class="mb-3">Trang bạn tìm kiếm không tồn tại</h3>
        <p class="text-muted mb-4">Có thể đường dẫn đã bị thay đổi hoặc trang đã bị xóa.</p>
        <a href="/dashboard" class="btn btn-premium px-5 py-3 shadow">🏠 Về trang chủ</a>
      </div>
    </body>
    </html>
  `);
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err.stack);
  res.status(500).send(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>500 - Lỗi Server</title>
      <link href="/bootstrap/bootstrap.min.css" rel="stylesheet" />
      <link href="/css/style.css" rel="stylesheet" />
    </head>
    <body class="d-flex align-items-center justify-content-center vh-100" style="background-color: #fcfcfc;">
      <div class="text-center p-5">
        <h1 class="playfair" style="font-size: 8rem; color: var(--accent-color);">500</h1>
        <h3 class="mb-3">Đã xảy ra lỗi hệ thống</h3>
        <p class="text-muted mb-4">Xin lỗi, có lỗi xảy ra từ phía máy chủ. Vui lòng thử lại sau.</p>
        <a href="/dashboard" class="btn btn-premium px-5 py-3 shadow">🏠 Về trang chủ</a>
      </div>
    </body>
    </html>
  `);
});
async function main() {
  try {
    await connect();
    console.log("Ket noi DB thanh cong");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server dang chay tai http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log("Loi ket noi DB:", err);
  }
}

// Chỉ khởi động server khi chạy trực tiếp (không phải khi import bởi test)
if (require.main === module) {
  main();
}

module.exports = { app, main };
