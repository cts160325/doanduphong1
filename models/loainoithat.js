const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  mLoaiNoiThat: mongoose.Schema.Types.String,
  tenLoai: mongoose.Schema.Types.String,
});

module.exports = mongoose.model("LoaiNoiThat", categorySchema);
