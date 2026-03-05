/**
 * Recoil Example
 *
 * NOTE: Recoil은 2025년 1월 아카이브되었습니다.
 * 신규 프로젝트에서는 사용을 권장하지 않습니다.
 * 동일한 atomic 패턴의 Jotai로 마이그레이션을 권장합니다.
 */

import React, { useState } from 'react';
import { RecoilRoot, atom, selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// --- Types ---
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

// --- Atoms ---
const counterState = atom<number>({
  key: 'counterState',
  default: 0,
});

const todosState = atom<Todo[]>({
  key: 'todosState',
  default: [],
});

const filterState = atom<FilterType>({
  key: 'filterState',
  default: 'all',
});

// --- Selectors ---
const filteredTodosState = selector<Todo[]>({
  key: 'filteredTodosState',
  get: ({ get }) => {
    const todos = get(todosState);
    const filter = get(filterState);
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  },
});

// --- Counter Component ---
const Counter: React.FC = () => {
  const [count, setCount] = useRecoilState(counterState);

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
  const filteredTodos = useRecoilValue(filteredTodosState);
  const [filter, setFilter] = useRecoilState(filterState);
  const setTodos = useSetRecoilState(todosState);

  const handleAdd = () => {
    if (input.trim()) {
      setTodos((prev) => [...prev, { id: Date.now(), text: input.trim(), completed: false }]);
      setInput('');
    }
  };

  const handleToggle = (id: number) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleRemove = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
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
              onClick={() => handleToggle(todo.id)}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer' }}
            >
              {todo.text}
            </span>
            <button onClick={() => handleRemove(todo.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- App ---
const App: React.FC = () => (
  <RecoilRoot>
    <div>
      <h1>Recoil Example (Archived)</h1>
      <Counter />
      <TodoList />
    </div>
  </RecoilRoot>
);

export default App;
