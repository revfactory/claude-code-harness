const todoStore = require("../models/todoStore");

const todoController = {
  getAll(req, res) {
    const todos = todoStore.findAll();
    res.status(200).json(todos);
  },

  getById(req, res) {
    const todo = todoStore.findById(req.resourceId);
    if (!todo) {
      return res.status(404).json({ error: "TODO를 찾을 수 없습니다." });
    }
    res.status(200).json(todo);
  },

  create(req, res) {
    const todo = todoStore.create({ title: req.body.title.trim() });
    res.status(201).json(todo);
  },

  update(req, res) {
    const data = {};
    if (req.body.title !== undefined) {
      data.title = req.body.title.trim();
    }
    if (req.body.completed !== undefined) {
      data.completed = Boolean(req.body.completed);
    }

    const todo = todoStore.update(req.resourceId, data);
    if (!todo) {
      return res.status(404).json({ error: "TODO를 찾을 수 없습니다." });
    }
    res.status(200).json(todo);
  },

  delete(req, res) {
    const todo = todoStore.delete(req.resourceId);
    if (!todo) {
      return res.status(404).json({ error: "TODO를 찾을 수 없습니다." });
    }
    res.status(200).json(todo);
  },
};

module.exports = todoController;
