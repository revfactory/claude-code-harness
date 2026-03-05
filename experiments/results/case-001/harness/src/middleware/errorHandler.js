function errorHandler(err, req, res, _next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "잘못된 JSON 형식입니다." });
  }

  console.error(err.stack);
  res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
}

module.exports = errorHandler;
