// Jotai - Counter + TODO App Example
import React, { useState } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// ============================================================
// 1. Counter Atoms
// ============================================================
const countAtom = atom(0);

// 파생 atom (읽기 전용)
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 액션 atom (쓰기 전용)
const incrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) + 1);
});

const decrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) - 1);
});

const incrementByAmountAtom = atom(null, (get, set, amount: number) => {
  set(countAtom, get(countAtom) + amount);
});

// ============================================================
// 2. Todo Atoms
// ============================================================
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

const todosAtom = atom<Todo[]>([]);
const nextIdAtom = atom(1);
const filterAtom = atom<FilterType>('all');

// 파생 atom: 필터링된 목록
const filteredTodosAtom = atom((get) => {
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

// 파생 atom: 통계
const todoStatsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };
});

// 액션 atom: Todo 추가
const addTodoAtom = atom(null, (get, set, text: string) => {
  const id = get(nextIdAtom);
  set(todosAtom, (prev) => [...prev, { id, text, completed: false }]);
  set(nextIdAtom, id + 1);
});

// 액션 atom: Todo 토글
const toggleTodoAtom = atom(null, (_get, set, id: number) => {
  set(todosAtom, (prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
});

// 액션 atom: Todo 삭제
const removeTodoAtom = atom(null, (_get, set, id: number) => {
  set(todosAtom, (prev) => prev.filter((todo) => todo.id !== id));
});

// 액션 atom: 완료 항목 제거
const clearCompletedAtom = atom(null, (_get, set) => {
  set(todosAtom, (prev) => prev.filter((todo) => !todo.completed));
});

// ============================================================
// 3. Counter Component
// ============================================================
const Counter: React.FC = () => {
  const count = useAtomValue(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  const [, doIncrement] = useAtom(incrementAtom);
  const [, doDecrement] = useAtom(decrementAtom);
  const [, doIncrementByAmount] = useAtom(incrementByAmountAtom);

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Counter (Jotai)</h2>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={doDecrement}>-</button>
      <button onClick={doIncrement}>+</button>
      <button onClick={() => doIncrementByAmount(5)}>+5</button>
    </div>
  );
};

// ============================================================
// 4. Todo Components
// ============================================================
const TodoInput: React.FC = () => {
  const [text, setText] = useState('');
  const addTodo = useSetAtom(addTodoAtom);

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
  const [filter, setFilter] = useAtom(filterAtom);
  const clearCompleted = useSetAtom(clearCompletedAtom);
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
  const filteredTodos = useAtomValue(filteredTodosAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const removeTodo = useSetAtom(removeTodoAtom);

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
  const stats = useAtomValue(todoStatsAtom);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Todo App (Jotai)</h2>
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
// 5. Root App (Provider optional in Jotai v2+)
// ============================================================
const App: React.FC = () => (
  <>
    <Counter />
    <TodoApp />
  </>
);

export default App;
