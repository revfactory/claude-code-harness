import React, { useState } from 'react';
import { atom, useAtom } from 'jotai';

// --- Types ---
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

// --- Atoms ---
const counterAtom = atom<number>(0);
const todosAtom = atom<Todo[]>([]);
const filterAtom = atom<FilterType>('all');

// Derived atom: filtered todos
const filteredTodosAtom = atom<Todo[]>((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);
  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});

// Write-only atoms for actions
const addTodoAtom = atom(null, (get, set, text: string) => {
  const todos = get(todosAtom);
  set(todosAtom, [...todos, { id: Date.now(), text, completed: false }]);
});

const toggleTodoAtom = atom(null, (get, set, id: number) => {
  const todos = get(todosAtom);
  set(todosAtom, todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
});

const removeTodoAtom = atom(null, (get, set, id: number) => {
  const todos = get(todosAtom);
  set(todosAtom, todos.filter((t) => t.id !== id));
});

// --- Counter Component ---
const Counter: React.FC = () => {
  const [count, setCount] = useAtom(counterAtom);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

// --- TodoList Component ---
const TodoList: React.FC = () => {
  const [input, setInput] = useState('');
  const [filteredTodos] = useAtom(filteredTodosAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  const [, addTodo] = useAtom(addTodoAtom);
  const [, toggleTodo] = useAtom(toggleTodoAtom);
  const [, removeTodo] = useAtom(removeTodoAtom);

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
    <h1>Jotai Example</h1>
    <Counter />
    <TodoList />
  </div>
);

export default App;
