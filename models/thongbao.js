const mongoose = require("mongoose");

const thongBaoSchema = new mongoose.Schema({
  donHangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DonHang",
    required: true
  },
  thanhVienId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ThanhVien",
    required: true
  },
  noiDung: {
    type: String,
    required: true
  },
  loai: {
    type: String,
    enum: ["xac_nhan_nhan_hang", "thong_bao_chung"],
    default: "xac_nhan_nhan_hang"
  },
  trangThai: {
    type: String,
    enum: ["chua_doc", "da_doc", "da_xac_nhan", "chua_nhan"],
    default: "chua_doc"
  },
  ngayGui: {
    type: Date,
    default: Date.now
  },
  ngayPhanHoi: {
    type: Date
  }
});

module.exports = mongoose.model("ThongBao", thongBaoSchema);
