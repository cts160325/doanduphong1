# 🛋️ Nội Thất SSC - Premium Furniture Management

Hệ thống quản lý cửa hàng nội thất cao cấp với đầy đủ chức năng bán hàng, quản trị và theo dõi đơn hàng.

## 🚀 Tính Năng

### Khách hàng
- 🛒 Giỏ hàng & Đặt hàng (thành viên + khách vãng lai)
- 📦 Theo dõi đơn hàng, hủy đơn
- ⭐ Đánh giá sản phẩm
- 🔔 Thông báo xác nhận nhận hàng
- 👤 Quản lý thông tin cá nhân & đổi mật khẩu
- 🔍 Tìm kiếm, lọc theo danh mục, phân trang

### Quản trị viên (Admin)
- 📊 Dashboard tổng quan (doanh thu, đơn hàng, thống kê)
- 🛋️ CRUD Sản phẩm (upload ảnh, mô tả chi tiết)
- 📋 CRUD Danh mục
- 👥 Quản lý thành viên (đổi quyền, xóa)
- 📦 Quản lý đơn hàng (cập nhật trạng thái)
- ⭐ Quản lý đánh giá
- ⚙️ Cấu hình hệ thống (tên, logo, hotline...)

### Bảo mật
- 🔐 Mật khẩu hash bcrypt
- 🛡️ XSS Protection (HTML escape)
- 🚫 Rate Limiting (chống spam đặt hàng)
- 🔒 Session httpOnly + sameSite strict
- 👮 RBAC (Role-Based Access Control)

## 📦 Cài Đặt

### Yêu cầu
- Node.js >= 18
- MongoDB >= 6

### Bước 1: Clone & Cài đặt
```bash
git clone <repo-url>
cd qlnoithat-ssc
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env` tại thư mục gốc:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/QLNoiThat
SESSION_SECRET=your-secret-key-here
```

### Bước 3: Khởi tạo dữ liệu mẫu
```bash
node seed.js
node createAdmin.js
```

### Bước 4: Chạy server
```bash
npm start
```

Truy cập: **http://localhost:3000**

### Tài khoản Admin mặc định
- Email: `thiensonadmin@gmail.com`
- Mật khẩu: `123456`

## 🛠️ Công Nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Express.js 5 |
| Template | EJS |
| Database | MongoDB + Mongoose |
| Auth | express-session + bcrypt |
| Upload | Multer |
| Styling | Bootstrap 5 + Custom CSS |

## 📁 Cấu Trúc Dự Án

```
qlnoithat-ssc/
├── index.js              # Server chính (routes)
├── seed.js               # Dữ liệu mẫu
├── createAdmin.js        # Tạo tài khoản admin
├── .env                  # Cấu hình môi trường
├── models/               # Mongoose models
│   ├── connect.js
│   ├── noithat.js        # Sản phẩm
│   ├── loainoithat.js    # Danh mục
│   ├── thanhvien.js      # Thành viên
│   ├── donhang.js        # Đơn hàng
│   ├── review.js         # Đánh giá
│   ├── thongbao.js       # Thông báo
│   └── hethong.js        # Cấu hình hệ thống
├── views/                # EJS templates
│   ├── layout/           # Header & Footer
│   ├── products/         # CRUD sản phẩm
│   ├── categories/       # CRUD danh mục
│   ├── members/          # CRUD thành viên
│   └── admin/            # Quản trị
└── public/               # Static assets
    ├── css/style.css
    ├── bootstrap/
    └── images/
```

## 📄 License

ISC
