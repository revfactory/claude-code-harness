// Recoil - Counter + TODO App Example
// 주의: Recoil은 2024년 이후 유지보수가 사실상 중단됨. 신규 프로젝트에서는 Jotai 등 대안 권장.
import React, { useState } from 'react';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';

// ============================================================
// 1. Counter State
// ============================================================
const countState = atom<number>({
  key: 'countState',
  default: 0,
});

const doubleCountState = selector<number>({
  key: 'doubleCountState',
  get: ({ get }) => get(countState) * 2,
});

// ============================================================
// 2. Todo State
// ============================================================
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

const todoListState = atom<Todo[]>({
  key: 'todoListState',
  default: [],
});

const nextIdState = atom<number>({
  key: 'nextIdState',
  default: 1,
});

const todoFilterState = atom<FilterType>({
  key: 'todoFilterState',
  default: 'all',
});

const filteredTodoListState = selector<Todo[]>({
  key: 'filteredTodoListState',
  get: ({ get }) => {
    const filter = get(todoFilterState);
    const list = get(todoListState);
    switch (filter) {
      case 'active':
        return list.filter((t) => !t.completed);
      case 'completed':
        return list.filter((t) => t.completed);
      default:
        return list;
    }
  },
});

const todoStatsState = selector({
  key: 'todoStatsState',
  get: ({ get }) => {
    const list = get(todoListState);
    return {
      total: list.length,
      active: list.filter((t) => !t.completed).length,
      completed: list.filter((t) => t.completed).length,
    };
  },
});

// ============================================================
// 3. Counter Component
// ============================================================
const Counter: React.FC = () => {
  const [count, setCount] = useRecoilState(countState);
  const doubleCount = useRecoilValue(doubleCountState);

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Counter (Recoil)</h2>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount((c) => c + 5)}>+5</button>
    </div>
  );
};

// ============================================================
// 4. Todo Components
// ============================================================
const TodoInput: React.FC = () => {
  const [text, setText] = useState('');
  const setTodoList = useSetRecoilState(todoListState);
  const [nextId, setNextId] = useRecoilState(nextIdState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      setTodoList((prev) => [
        ...prev,
        { id: nextId, text: text.trim(), completed: false },
      ]);
      setNextId((id) => id + 1);
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
  const [filter, setFilter] = useRecoilState(todoFilterState);
  const setTodoList = useSetRecoilState(todoListState);
  const filters: FilterType[] = ['all', 'active', 'completed'];

  const handleClearCompleted = () => {
    setTodoList((prev) => prev.filter((t) => !t.completed));
  };

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
      <button onClick={handleClearCompleted}>Clear Completed</button>
    </div>
  );
};

const TodoList: React.FC = () => {
  const filteredTodos = useRecoilValue(filteredTodoListState);
  const setTodoList = useSetRecoilState(todoListState);

  const toggleTodo = (id: number) => {
    setTodoList((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const removeTodo = (id: number) => {
    setTodoList((prev) => prev.filter((todo) => todo.id !== id));
  };

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
  const stats = useRecoilValue(todoStatsState);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Todo App (Recoil)</h2>
      <p>
        {stats.active} active / {stats.total} total
      </p>
      <TodoInput />
      <TodoFilters />
      <TodoList />
    </div>
  );
};

// ============================================================
// 5. Root App (RecoilRoot 필수)
// ============================================================
const App: React.FC = () => (
  <RecoilRoot>
    <Counter />
    <TodoApp />
  </RecoilRoot>
);

export default App;
