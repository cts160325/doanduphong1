/**
 * setup.js — Khởi tạo MongoDB In-Memory Server cho toàn bộ test suite.
 * 
 * Mỗi file test sẽ import { connectDB, closeDB, clearDB } từ đây
 * để có một MongoDB ảo chạy trên RAM, hoàn toàn tách biệt với DB thật.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/**
 * Kết nối tới MongoDB In-Memory Server.
 * Gọi trong beforeAll() của mỗi test file.
 */
async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Đặt biến môi trường để app sử dụng DB test thay vì DB thật
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
}

/**
 * Đóng kết nối và dừng MongoDB server.
 * Gọi trong afterAll() của mỗi test file.
 */
async function closeDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Xóa toàn bộ dữ liệu trong tất cả collections.
 * Gọi trong afterEach() để mỗi test case bắt đầu với DB sạch.
 */
async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectDB, closeDB, clearDB };
