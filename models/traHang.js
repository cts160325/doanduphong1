const mongoose = require("mongoose");

const traHangSchema = new mongoose.Schema({
  maYeuCau: {
    type: String,
    required: true,
    unique: true
  },
  donHangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DonHang",
    required: true
  },
  thanhVienId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ThanhVien",
    required: false
  },
  guestInfo: {
    hoTen: String,
    soDT: String,
    diaChi: String
  },
  lyDo: {
    type: String,
    required: true,
    enum: [
      "Hàng bể vỡ, trầy xước do vận chuyển",
      "Giao sai sản phẩm, màu sắc, kích thước",
      "Sản phẩm bị lỗi kỹ thuật, thiếu phụ kiện",
      "Hàng khác xa so với mô tả / hình ảnh",
      "Không còn nhu cầu sử dụng (Đổi ý)",
      "Khác"
    ]
  },
  chiTietLyDo: {
    type: String,
    default: ""
  },
  bangChungHinhAnh: [{
    type: String
  }],
  soTienHoan: {
    type: Number,
    required: true,
    min: 0
  },
  phuongThucHoanTien: {
    type: String,
    default: "Chuyển khoản ngân hàng"
  },
  thongTinNganHang: {
    tenNganHang: { type: String, default: "" },
    soTaiKhoan: { type: String, default: "" },
    chuTaiKhoan: { type: String, default: "" }
  },
  trangThai: {
    type: String,
    enum: [
      "da_gui_yeu_cau",
      "cho_phe_duyet",
      "dong_goi_gui_tra",
      "van_chuyen_hang_hoan",
      "da_nhan_tien_hoan",
      "tu_choi",
      "khieu_nai"
    ],
    default: "da_gui_yeu_cau"
  },
  hinhThucGuiHang: {
    type: String,
    enum: ["lay_tan_noi", "gui_buu_cuc"],
    default: "lay_tan_noi"
  },
  diaChiLayHang: {
    type: String,
    default: ""
  },
  maVanDonTra: {
    type: String,
    default: ""
  },
  donViVanChuyen: {
    type: String,
    default: "Shopee Xpress / Giao Hàng Nhanh"
  },
  ghiChuNguoiBan: {
    type: String,
    default: ""
  },
  hanXuLy: {
    type: Date,
    default: () => new Date(+new Date() + 48 * 60 * 60 * 1000) // Mặc định 48h để người bán phản hồi
  },
  ngayTao: {
    type: Date,
    default: Date.now
  },
  ngayCapNhat: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TraHang", traHangSchema);
