import React, { useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

// --- Types ---
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

interface AppState {
  counter: number;
  todos: Todo[];
  filter: FilterType;
}

// --- Proxy State ---
const state = proxy<AppState>({
  counter: 0,
  todos: [],
  filter: 'all',
});

// --- Actions (직접 mutation) ---
const actions = {
  increment: () => { state.counter += 1; },
  decrement: () => { state.counter -= 1; },
  reset: () => { state.counter = 0; },
  addTodo: (text: string) => {
    state.todos.push({ id: Date.now(), text, completed: false });
  },
  toggleTodo: (id: number) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
  },
  removeTodo: (id: number) => {
    const index = state.todos.findIndex((t) => t.id === id);
    if (index !== -1) state.todos.splice(index, 1);
  },
  setFilter: (filter: FilterType) => {
    state.filter = filter;
  },
};

// --- Helper ---
const getFilteredTodos = (todos: Todo[], filter: FilterType): Todo[] => {
  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
};

// --- Counter Component ---
const Counter: React.FC = () => {
  const snap = useSnapshot(state);

  return (
    <div>
      <h2>Counter: {snap.counter}</h2>
      <button onClick={actions.increment}>+</button>
      <button onClick={actions.decrement}>-</button>
      <button onClick={actions.reset}>Reset</button>
    </div>
  );
};

// --- TodoList Component ---
const TodoList: React.FC = () => {
  const [input, setInput] = useState('');
  const snap = useSnapshot(state);
  const filteredTodos = getFilteredTodos(snap.todos as Todo[], snap.filter);

  const handleAdd = () => {
    if (input.trim()) {
      actions.addTodo(input.trim());
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
          <button key={f} onClick={() => actions.setFilter(f)} style={{ fontWeight: snap.filter === f ? 'bold' : 'normal' }}>
            {f}
          </button>
        ))}
      </div>
      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => actions.toggleTodo(todo.id)}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer' }}
            >
              {todo.text}
            </span>
            <button onClick={() => actions.removeTodo(todo.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- App ---
const App: React.FC = () => (
  <div>
    <h1>Valtio Example</h1>
    <Counter />
    <TodoList />
  </div>
);

export default App;
