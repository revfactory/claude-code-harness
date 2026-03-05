const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { validateTodoBody, validateIdParam } = require("../middleware/validate");

router.get("/", todoController.getAll);
router.get("/:id", validateIdParam, todoController.getById);
router.post("/", validateTodoBody, todoController.create);
router.put("/:id", validateIdParam, validateTodoBody, todoController.update);
router.delete("/:id", validateIdParam, todoController.delete);

module.exports = router;
