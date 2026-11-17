import { useEffect, useMemo, useState } from 'react';
import {
  MAX_TEXT_LENGTH,
  addTodo,
  filterTodos,
  nextId,
  removeTodo,
  toggleTodo,
  updateTodo,
  type Todo,
  type TodoFilter,
} from '../todo';
import { STORAGE_VERSION, readSnapshot, writeSnapshot, type TodoSnapshot } from '../storage';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import ThemeStatus from './ThemeStatus';
import ThemeToggle from './ThemeToggle';

const STORAGE_KEY = 'todo-app-v3';
const LEGACY_STORAGE_KEY = 'todo-app-v2';

const FILTER_OPTIONS: readonly { readonly value: TodoFilter; readonly label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
];

interface StartupState {
  readonly todos: readonly Todo[];
  readonly filter: TodoFilter;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error: unknown) {
    console.error('[Todo] 读取存储失败', error);
    return null;
  }
}

function persist(snapshot: TodoSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, writeSnapshot(snapshot));
  } catch (error: unknown) {
    console.error('[Todo] 保存失败', error);
  }
}

/** 惰性初始化用：只在组件首次渲染时读一次存储；读不到或坏数据就回空状态 */
function loadInitialState(): StartupState {
  const raw = readStorage(STORAGE_KEY) ?? readStorage(LEGACY_STORAGE_KEY);
  const result = readSnapshot(raw);
  if (!result.ok) {
    return { todos: [], filter: 'all' };
  }
  return { todos: result.snapshot.todos, filter: result.snapshot.filter };
}

/**
 * 根组件：唯一持有业务 state 的地方。
 * 数据向下传（props），事件向上传（回调），增删改都走 todo.ts 的纯函数做不可变更新，
 * 组件里不做任何直接的 DOM 操作，渲染完全由 state 驱动。
 */
export default function TodoApp() {
  // 惰性初始化：useState(() => ...) 只在首次渲染执行一次，读存储发生在渲染期，
  // 不会像"在 Effect 里 setState"那样出现"先写空数组把已有数据覆盖掉"的时序问题。
  const [initial] = useState<StartupState>(() => loadInitialState());
  const [todos, setTodos] = useState<readonly Todo[]>(initial.todos);
  const [filter, setFilter] = useState<TodoFilter>(initial.filter);
  const [message, setMessage] = useState('');

  useEffect(() => {
    persist({ version: STORAGE_VERSION, todos, filter });
  }, [todos, filter]);

  // 开发环境把 state 打到控制台，方便对照“页面呈现”和“数据”
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[TodoApp] todos =', JSON.stringify(todos), 'filter =', filter);
    }
  }, [todos, filter]);

  const visibleTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);

  const handleAdd = (rawText: string): boolean => {
    const result = addTodo(todos, rawText, nextId(todos));
    if (!result.ok) {
      setMessage(
        result.reason === 'too-long'
          ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字`
          : '请输入内容后再添加',
      );
      return false;
    }
    setTodos(result.todos);
    setMessage('');
    return true;
  };

  const handleToggle = (id: number): void => {
    setTodos(toggleTodo(todos, id));
  };

  const handleRemove = (id: number): void => {
    setTodos(removeTodo(todos, id));
  };

  const handleEdit = (id: number): void => {
    const target = todos.find((todo) => todo.id === id);
    if (target === undefined) return;
    const newText = window.prompt('修改任务内容：', target.text);
    if (newText === null) return;
    const result = updateTodo(todos, id, newText);
    if (!result.ok) {
      setMessage(
        result.reason === 'too-long' ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字` : '内容不能为空',
      );
      return;
    }
    setTodos(result.todos);
    setMessage('');
  };

  return (
    <div className="todo-app">
      <header className="app-header">
        <h1>Todo V4.0</h1>
        <ThemeToggle />
      </header>
      <TodoForm message={message} onAdd={handleAdd} />
      <nav className="filter-row" aria-label="筛选">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === filter ? 'active' : ''}
            onClick={() => {
              setFilter(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </nav>
      <p className="summary">
        共 {todos.length} 条，未完成 {todos.filter((todo) => !todo.completed).length} 条
        <ThemeStatus />
      </p>
      <TodoList
        todos={visibleTodos}
        onToggle={handleToggle}
        onRemove={handleRemove}
        onEdit={handleEdit}
      />
    </div>
  );
}
