const mongoose = require("mongoose");

const noithatSchema = new mongoose.Schema({
  mNoiThat: {
    type: String,
    required: true,
    match: [/^[^<>]*$/, 'Không được chứa ký tự HTML']
  },
  tenNoiThat: {
    type: String,
    required: true,
    match: [/^[^<>]*$/, 'Không được chứa ký tự HTML']
  },
  gia: {
    type: Number,
    required: true,
    min: [1, 'Giá phải lớn hơn 0']
  },
  donViTinh: {
    type: String,
    match: [/^[^<>]*$/, 'Không được chứa ký tự HTML']
  },
  xuatXu: {
    type: String,
    match: [/^[^<>]*$/, 'Không được chứa ký tự HTML']
  },
  loaiNoiThat: String,
  hinhAnh: {
    type: String,
    default: "https://via.placeholder.com/300x200?text=Noi+That"
  },
  moTa: {
    type: String,
    default: ""
  },
  tonKho: {
    type: Number,
    default: 50, // Mặc định có 50 sản phẩm trong kho
    min: [0, 'Kho không thể âm']
  }
});

module.exports = mongoose.model("NoiThat", noithatSchema);