const mongoose = require("mongoose");

const donHangSchema = new mongoose.Schema({
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
  noithatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NoiThat",
    required: true
  },
  soLuong: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Số lượng tối thiểu là 1'],
    max: [100, 'Số lượng tối đa là 100']
  },
  tongTien: {
    type: Number,
    required: true,
    min: [0, 'Tổng tiền không hợp lệ']
  },
  ngayDat: {
    type: Date,
    default: Date.now
  },
  giamGia: {
    type: Number,
    default: 0
  },
  trangThai: {
    type: String,
    enum: ["Chờ xác nhận", "Đang chuẩn bị hàng", "Đang giao", "Hoàn thành", "Đã hủy", "Yêu cầu hủy"],
    default: "Chờ xác nhận"
  }
});

module.exports = mongoose.model("DonHang", donHangSchema);