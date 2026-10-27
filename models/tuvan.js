const mongoose = require("mongoose");

const tuVanSchema = new mongoose.Schema({
  hoTen: {
    type: String,
    required: true,
    trim: true
  },
  soDT: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  noiDung: {
    type: String,
    required: true,
    trim: true
  },
  ngayGui: {
    type: Date,
    default: Date.now
  },
  trangThai: {
    type: String,
    enum: ["Chưa xử lý", "Đã liên hệ"],
    default: "Chưa xử lý"
  }
});

module.exports = mongoose.model("TuVan", tuVanSchema);
