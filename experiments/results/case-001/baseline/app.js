const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory storage
let todos = [];
let nextId = 1;

// GET /todos - List all todos
app.get('/todos', (req, res) => {
  res.status(200).json(todos);
});

// GET /todos/:id - Get a single todo
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.status(200).json(todo);
});

// POST /todos - Create a new todo
app.post('/todos', (req, res) => {
  const { title } = req.body;

  if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const todo = {
    id: nextId++,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { title, completed } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    todo.title = title.trim();
  }

  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }
    todo.completed = completed;
  }

  res.status(200).json(todo);
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const deleted = todos.splice(index, 1)[0];
  res.status(200).json(deleted);
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TODO API server running on port ${PORT}`);
  });
}

module.exports = { app, todos, resetStore: () => { todos.length = 0; nextId = 1; } };
