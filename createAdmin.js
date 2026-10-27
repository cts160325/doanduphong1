const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connect = require("./models/connect.js");
const ThanhVien = require("./models/thanhvien.js");

async function createAdmin() {
  try {
    await connect();
    const emailAdmin = "thiensonadmin@gmail.com";
    
    // Hash mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);
    
    const adminData = {
      hoTen: "Thiên Sơn Admin",
      matKhau: hashedPassword,
      soDT: "0999999999",
      vaiTro: "admin"
    };

    const admin = await ThanhVien.findOneAndUpdate(
      { email: emailAdmin },
      adminData,
      { upsert: true, new: true }
    );

    console.log("-----------------------------------------");
    console.log("CẬP NHẬT TÀI KHOẢN ADMIN THÀNH CÔNG!");
    console.log(`Email: ${emailAdmin}`);
    console.log(`Mật khẩu: 123456`);
    console.log(`Quyền: admin`);
    console.log("-----------------------------------------");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
