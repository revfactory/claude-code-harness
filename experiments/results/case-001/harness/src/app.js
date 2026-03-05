const express = require("express");
const todoRoutes = require("./routes/todoRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/todos", todoRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TODO API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;
