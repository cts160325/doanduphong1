const mongoose = require("mongoose");

const heThongSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: String, required: true },
  description: String
});

module.exports = mongoose.model("HeThong", heThongSchema);
