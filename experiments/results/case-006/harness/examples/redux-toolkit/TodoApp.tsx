import React, { useState } from 'react';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';

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

// --- Slice ---
const initialState: AppState = {
  counter: 0,
  todos: [],
  filter: 'all',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    increment(state) {
      state.counter += 1;
    },
    decrement(state) {
      state.counter -= 1;
    },
    reset(state) {
      state.counter = 0;
    },
    addTodo(state, action: PayloadAction<string>) {
      state.todos.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo(state, action: PayloadAction<number>) {
      const todo = state.todos.find((t) => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    removeTodo(state, action: PayloadAction<number>) {
      state.todos = state.todos.filter((t) => t.id !== action.payload);
    },
    setFilter(state, action: PayloadAction<FilterType>) {
      state.filter = action.payload;
    },
  },
});

const { increment, decrement, reset, addTodo, toggleTodo, removeTodo, setFilter } = appSlice.actions;

// --- Store ---
const store = configureStore({
  reducer: appSlice.reducer,
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// --- Selectors ---
const selectFilteredTodos = (state: RootState): Todo[] => {
  const { todos, filter } = state;
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
  const count = useSelector((state: RootState) => state.counter);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(reset())}>Reset</button>
    </div>
  );
};

// --- TodoList Component ---
const TodoList: React.FC = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector(selectFilteredTodos);
  const currentFilter = useSelector((state: RootState) => state.filter);

  const handleAdd = () => {
    if (input.trim()) {
      dispatch(addTodo(input.trim()));
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
          <button key={f} onClick={() => dispatch(setFilter(f))} style={{ fontWeight: currentFilter === f ? 'bold' : 'normal' }}>
            {f}
          </button>
        ))}
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => dispatch(toggleTodo(todo.id))}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer' }}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch(removeTodo(todo.id))}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- App ---
const App: React.FC = () => (
  <Provider store={store}>
    <div>
      <h1>Redux Toolkit Example</h1>
      <Counter />
      <TodoList />
    </div>
  </Provider>
);

export default App;
