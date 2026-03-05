// Redux Toolkit - Counter + TODO App Example
import React, { useState } from 'react';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';

// ============================================================
// 1. Counter Slice
// ============================================================
interface CounterState {
  value: number;
}

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 } as CounterState,
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// ============================================================
// 2. Todo Slice
// ============================================================
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  items: Todo[];
  nextId: number;
  filter: 'all' | 'active' | 'completed';
}

const initialTodoState: TodoState = {
  items: [],
  nextId: 1,
  filter: 'all',
};

const todoSlice = createSlice({
  name: 'todos',
  initialState: initialTodoState,
  reducers: {
    addTodo(state, action: PayloadAction<string>) {
      state.items.push({
        id: state.nextId++,
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo(state, action: PayloadAction<number>) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo(state, action: PayloadAction<number>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    setFilter(state, action: PayloadAction<TodoState['filter']>) {
      state.filter = action.payload;
    },
    clearCompleted(state) {
      state.items = state.items.filter((t) => !t.completed);
    },
  },
});

export const { addTodo, toggleTodo, removeTodo, setFilter, clearCompleted } =
  todoSlice.actions;

// ============================================================
// 3. Store Configuration
// ============================================================
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    todos: todoSlice.reducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const useAppDispatch = () => useDispatch<AppDispatch>();

// ============================================================
// 4. Counter Component
// ============================================================
const Counter: React.FC = () => {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Counter (Redux Toolkit)</h2>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
};

// ============================================================
// 5. Todo Components
// ============================================================
const TodoInput: React.FC = () => {
  const [text, setText] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      dispatch(addTodo(text.trim()));
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
  const filter = useAppSelector((state) => state.todos.filter);
  const dispatch = useAppDispatch();
  const filters: TodoState['filter'][] = ['all', 'active', 'completed'];

  return (
    <div>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => dispatch(setFilter(f))}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
      <button onClick={() => dispatch(clearCompleted())}>Clear Completed</button>
    </div>
  );
};

const TodoList: React.FC = () => {
  const { items, filter } = useAppSelector((state) => state.todos);
  const dispatch = useAppDispatch();

  const filteredTodos = items.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {filteredTodos.map((todo) => (
        <li key={todo.id} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => dispatch(toggleTodo(todo.id))}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => dispatch(removeTodo(todo.id))}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

const TodoApp: React.FC = () => {
  const totalCount = useAppSelector((state) => state.todos.items.length);
  const activeCount = useAppSelector(
    (state) => state.todos.items.filter((t) => !t.completed).length
  );

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Todo App (Redux Toolkit)</h2>
      <p>
        {activeCount} active / {totalCount} total
      </p>
      <TodoInput />
      <TodoFilters />
      <TodoList />
    </div>
  );
};

// ============================================================
// 6. Root App with Provider
// ============================================================
const App: React.FC = () => (
  <Provider store={store}>
    <Counter />
    <TodoApp />
  </Provider>
);

export default App;
