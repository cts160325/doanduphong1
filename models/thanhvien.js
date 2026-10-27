const mongoose = require("mongoose");

const thanhVienSchema = new mongoose.Schema({
  hoTen: {
    type: String,
    required: true,
    match: [/^[^<>]*$/, 'Họ tên không được chứa ký tự HTML/Script']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  matKhau: { 
    type: String, 
    required: true,
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  soDT: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]*$/, 'Số điện thoại chỉ được chứa chữ số'],
    maxlength: [10, 'Số điện thoại không được vượt quá 10 chữ số']
  },
  diaChi: {
    type: String,
    match: [/^[^<>]*$/, 'Địa chỉ không được chứa ký tự HTML/Script']
  },
  vaiTro: {
    type: String,
    default: "user"
  },
  ngayDangKy: {
    type: Date,
    default: Date.now, 
  }
});

module.exports = mongoose.model("ThanhVien", thanhVienSchema);
