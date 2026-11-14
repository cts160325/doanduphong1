/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  // Chạy tuần tự để tránh xung đột DB giữa các test file
  maxWorkers: 1,
  // Timeout lâu hơn vì mongodb-memory-server cần thời gian khởi tạo
  testTimeout: 30000,
  // Hiển thị kết quả chi tiết
  verbose: true,
  // Bỏ qua node_modules
  testPathIgnorePatterns: ["/node_modules/"],
  // Tự động dọn dẹp mock sau mỗi test
  restoreMocks: true,
};
