const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  noithatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NoiThat",
    required: false
  },
  tenNguoiDanhGia: {
    type: String,
    default: "Khách hàng"
  },
  soSao: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  mucDo: String,
  chiTiet: String,
  ngayTao: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
