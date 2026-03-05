function validateTodoBody(req, res, next) {
  const { title } = req.body;

  if (title === undefined || title === null) {
    return res.status(400).json({ error: "title 필드는 필수입니다." });
  }

  if (typeof title !== "string") {
    return res.status(400).json({ error: "title은 문자열이어야 합니다." });
  }

  if (title.trim() === "") {
    return res.status(400).json({ error: "title은 빈 문자열일 수 없습니다." });
  }

  next();
}

function validateIdParam(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "유효하지 않은 ID입니다." });
  }

  req.resourceId = id;
  next();
}

module.exports = { validateTodoBody, validateIdParam };
