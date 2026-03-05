class TodoStore {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  findAll() {
    return this.todos.map((todo) => ({ ...todo }));
  }

  findById(id) {
    const todo = this.todos.find((t) => t.id === id);
    return todo ? { ...todo } : null;
  }

  create(data) {
    const todo = {
      id: this.nextId++,
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.push(todo);
    return { ...todo };
  }

  update(id, data) {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    if (data.title !== undefined) {
      this.todos[index].title = data.title;
    }
    if (data.completed !== undefined) {
      this.todos[index].completed = data.completed;
    }

    return { ...this.todos[index] };
  }

  delete(id) {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const deleted = this.todos.splice(index, 1)[0];
    return { ...deleted };
  }
}

module.exports = new TodoStore();
