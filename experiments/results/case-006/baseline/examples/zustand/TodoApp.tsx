// Zustand - Counter + TODO App Example
import React, { useState } from 'react';
import { create } from 'zustand';

// ============================================================
// 1. Counter Store
// ============================================================
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  incrementByAmount: (amount: number) => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  incrementByAmount: (amount) => set((state) => ({ count: state.count + amount })),
}));

// ============================================================
// 2. Todo Store
// ============================================================
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

interface TodoStore {
  items: Todo[];
  nextId: number;
  filter: FilterType;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  setFilter: (filter: FilterType) => void;
  clearCompleted: () => void;
  getFilteredTodos: () => Todo[];
}

const useTodoStore = create<TodoStore>((set, get) => ({
  items: [],
  nextId: 1,
  filter: 'all',

  addTodo: (text) =>
    set((state) => ({
      items: [...state.items, { id: state.nextId, text, completed: false }],
      nextId: state.nextId + 1,
    })),

  toggleTodo: (id) =>
    set((state) => ({
      items: state.items.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),

  removeTodo: (id) =>
    set((state) => ({
      items: state.items.filter((todo) => todo.id !== id),
    })),

  setFilter: (filter) => set({ filter }),

  clearCompleted: () =>
    set((state) => ({
      items: state.items.filter((todo) => !todo.completed),
    })),

  getFilteredTodos: () => {
    const { items, filter } = get();
    if (filter === 'active') return items.filter((t) => !t.completed);
    if (filter === 'completed') return items.filter((t) => t.completed);
    return items;
  },
}));

// ============================================================
// 3. Counter Component
// ============================================================
const Counter: React.FC = () => {
  const count = useCounterStore((s) => s.count);
  const increment = useCounterStore((s) => s.increment);
  const decrement = useCounterStore((s) => s.decrement);
  const incrementByAmount = useCounterStore((s) => s.incrementByAmount);

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Counter (Zustand)</h2>
      <p>Count: {count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={() => incrementByAmount(5)}>+5</button>
    </div>
  );
};

// ============================================================
// 4. Todo Components
// ============================================================
const TodoInput: React.FC = () => {
  const [text, setText] = useState('');
  const addTodo = useTodoStore((s) => s.addTodo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
      />
      <button type="submit">Add</button>
    </form>
  );
};

const TodoFilters: React.FC = () => {
  const filter = useTodoStore((s) => s.filter);
  const setFilter = useTodoStore((s) => s.setFilter);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);
  const filters: FilterType[] = ['all', 'active', 'completed'];

  return (
    <div>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
};

const TodoList: React.FC = () => {
  const getFilteredTodos = useTodoStore((s) => s.getFilteredTodos);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const removeTodo = useTodoStore((s) => s.removeTodo);
  const filteredTodos = getFilteredTodos();

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {filteredTodos.map((todo) => (
        <li key={todo.id} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

const TodoApp: React.FC = () => {
  const items = useTodoStore((s) => s.items);
  const activeCount = items.filter((t) => !t.completed).length;

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Todo App (Zustand)</h2>
      <p>
        {activeCount} active / {items.length} total
      </p>
      <TodoInput />
      <TodoFilters />
      <TodoList />
    </div>
  );
};

// ============================================================
// 5. Root App (No Provider needed!)
// ============================================================
const App: React.FC = () => (
  <>
    <Counter />
    <TodoApp />
  </>
);

export default App;
