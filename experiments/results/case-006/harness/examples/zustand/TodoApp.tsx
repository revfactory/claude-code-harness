import React, { useState } from 'react';
import { create } from 'zustand';

// --- Types ---
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

interface AppStore {
  counter: number;
  todos: Todo[];
  filter: FilterType;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  setFilter: (filter: FilterType) => void;
}

// --- Store ---
const useAppStore = create<AppStore>((set) => ({
  counter: 0,
  todos: [],
  filter: 'all',
  increment: () => set((state) => ({ counter: state.counter + 1 })),
  decrement: () => set((state) => ({ counter: state.counter - 1 })),
  reset: () => set({ counter: 0 }),
  addTodo: (text: string) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    })),
  toggleTodo: (id: number) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    })),
  removeTodo: (id: number) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),
  setFilter: (filter: FilterType) => set({ filter }),
}));

// --- Counter Component ---
const Counter: React.FC = () => {
  const counter = useAppStore((state) => state.counter);
  const increment = useAppStore((state) => state.increment);
  const decrement = useAppStore((state) => state.decrement);
  const reset = useAppStore((state) => state.reset);

  return (
    <div>
      <h2>Counter: {counter}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

// --- TodoList Component ---
const TodoList: React.FC = () => {
  const [input, setInput] = useState('');
  const todos = useAppStore((state) => state.todos);
  const filter = useAppStore((state) => state.filter);
  const addTodo = useAppStore((state) => state.addTodo);
  const toggleTodo = useAppStore((state) => state.toggleTodo);
  const removeTodo = useAppStore((state) => state.removeTodo);
  const setFilter = useAppStore((state) => state.setFilter);

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAdd = () => {
    if (input.trim()) {
      addTodo(input.trim());
      setInput('');
    }
  };

  return (
    <div>
      <h2>TODO List</h2>
      <div>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add todo..." />
        <button onClick={handleAdd}>Add</button>
      </div>
      <div>
        {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontWeight: filter === f ? 'bold' : 'normal' }}>
            {f}
          </button>
        ))}
      </div>
      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => toggleTodo(todo.id)}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer' }}
            >
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- App ---
const App: React.FC = () => (
  <div>
    <h1>Zustand Example</h1>
    <Counter />
    <TodoList />
  </div>
);

export default App;
