// Valtio - Counter + TODO App Example
import React, { useState } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { derive } from 'valtio/utils';

// ============================================================
// 1. Counter State (Proxy)
// ============================================================
const counterState = proxy({
  count: 0,
});

// 파생 상태
const counterDerived = derive({
  doubleCount: (get) => get(counterState).count * 2,
});

// 액션 함수 (일반 함수로 직접 mutation)
const counterActions = {
  increment: () => {
    counterState.count += 1;
  },
  decrement: () => {
    counterState.count -= 1;
  },
  incrementByAmount: (amount: number) => {
    counterState.count += amount;
  },
};

// ============================================================
// 2. Todo State (Proxy)
// ============================================================
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

const todoState = proxy<{
  items: Todo[];
  nextId: number;
  filter: FilterType;
}>({
  items: [],
  nextId: 1,
  filter: 'all',
});

// 액션 함수들 - 직접 mutation 스타일
const todoActions = {
  addTodo: (text: string) => {
    todoState.items.push({
      id: todoState.nextId++,
      text,
      completed: false,
    });
  },

  toggleTodo: (id: number) => {
    const todo = todoState.items.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  },

  removeTodo: (id: number) => {
    const index = todoState.items.findIndex((t) => t.id === id);
    if (index !== -1) {
      todoState.items.splice(index, 1);
    }
  },

  setFilter: (filter: FilterType) => {
    todoState.filter = filter;
  },

  clearCompleted: () => {
    todoState.items = todoState.items.filter((t) => !t.completed);
  },
};

// 헬퍼: 필터링된 목록 계산
const getFilteredTodos = (items: Todo[], filter: FilterType): Todo[] => {
  switch (filter) {
    case 'active':
      return items.filter((t) => !t.completed);
    case 'completed':
      return items.filter((t) => t.completed);
    default:
      return items;
  }
};

// ============================================================
// 3. Counter Component
// ============================================================
const Counter: React.FC = () => {
  const snap = useSnapshot(counterState);
  const derived = useSnapshot(counterDerived);

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Counter (Valtio)</h2>
      <p>Count: {snap.count}</p>
      <p>Double: {derived.doubleCount}</p>
      <button onClick={counterActions.decrement}>-</button>
      <button onClick={counterActions.increment}>+</button>
      <button onClick={() => counterActions.incrementByAmount(5)}>+5</button>
    </div>
  );
};

// ============================================================
// 4. Todo Components
// ============================================================
const TodoInput: React.FC = () => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      todoActions.addTodo(text.trim());
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
  const snap = useSnapshot(todoState);
  const filters: FilterType[] = ['all', 'active', 'completed'];

  return (
    <div>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => todoActions.setFilter(f)}
          style={{ fontWeight: snap.filter === f ? 'bold' : 'normal' }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
      <button onClick={todoActions.clearCompleted}>Clear Completed</button>
    </div>
  );
};

const TodoList: React.FC = () => {
  const snap = useSnapshot(todoState);
  const filteredTodos = getFilteredTodos(snap.items as Todo[], snap.filter);

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {filteredTodos.map((todo) => (
        <li key={todo.id} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => todoActions.toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => todoActions.removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

const TodoApp: React.FC = () => {
  const snap = useSnapshot(todoState);
  const activeCount = snap.items.filter((t) => !t.completed).length;

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Todo App (Valtio)</h2>
      <p>
        {activeCount} active / {snap.items.length} total
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
