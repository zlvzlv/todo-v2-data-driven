/**
 * Todo V2.0 数据层
 *
 * W8 的 index.html 把「状态 - 渲染 - 事件 - 存储」全塞在一个 IIFE 里，
 * 这次重构把「数据」单独抽成纯函数模块：不碰 DOM、不读 localStorage，
 * 只做「数据进 → 数据出」，这样 Vitest 可以直接测，不用假造页面。
 */

export interface Todo {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
}

export type TodoFilter = 'all' | 'active' | 'completed';

/** 单条内容长度上限，与 W8 的 MAX_LENGTH 保持一致 */
export const MAX_TEXT_LENGTH = 100;

/** addTodo / updateTodo 失败的原因，调用方据此决定提示文案 */
export type FailureReason = 'empty' | 'too-long' | 'invalid-id' | 'duplicate-id' | 'not-found';

export type AddResult =
  | { readonly ok: true; readonly todo: Todo; readonly todos: readonly Todo[] }
  | { readonly ok: false; readonly reason: FailureReason };

export type UpdateResult =
  | { readonly ok: true; readonly todos: readonly Todo[] }
  | { readonly ok: false; readonly reason: FailureReason };

type TextCheck =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: 'empty' | 'too-long' };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 类型守卫：localStorage / JSON 里读出来的是 unknown 脏数据，
 * 必须先过这一关，才有资格当成 Todo 使用。
 */
export function isTodo(value: unknown): value is Todo {
  if (!isPlainObject(value)) return false;
  const { id, text, completed } = value;
  return (
    typeof id === 'number' &&
    Number.isInteger(id) &&
    id > 0 &&
    typeof text === 'string' &&
    typeof completed === 'boolean'
  );
}

/**
 * 把 localStorage 里读到的原始值解析成 Todo[]。
 * JSON 坏了、结构不是数组、数组里混了脏数据，都只做过滤或返回空数组，绝不抛错。
 */
export function parseTodos(raw: unknown): readonly Todo[] {
  let data: unknown = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  const list: unknown[] = data;
  return list.filter(isTodo);
}

/**
 * 把 li.dataset.id 的字符串转成 number。
 * dataset 只给字符串，直接 Number() 会拿到 NaN 污染整个业务层，
 * 所以非法值统一返回 null，由调用方提前 return。
 */
export function parseTodoId(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const id = Number(trimmed);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function checkText(rawText: string): TextCheck {
  const text = rawText.trim();
  if (text.length === 0) return { ok: false, reason: 'empty' };
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, reason: 'too-long' };
  return { ok: true, text };
}

function createTodo(id: number, text: string, completed = false): Todo {
  return { id, text, completed };
}

/** 自增 id：不再用 Date.now()，保证测试可复现，也不会同一毫秒内撞 id */
export function nextId(todos: readonly Todo[]): number {
  return todos.reduce((max, todo) => (todo.id > max ? todo.id : max), 0) + 1;
}

export function addTodo(todos: readonly Todo[], rawText: string, id: number): AddResult {
  const checked = checkText(rawText);
  if (!checked.ok) return checked;
  if (!Number.isInteger(id) || id <= 0) return { ok: false, reason: 'invalid-id' };
  if (todos.some((todo) => todo.id === id)) return { ok: false, reason: 'duplicate-id' };
  const todo = createTodo(id, checked.text);
  return { ok: true, todo, todos: [...todos, todo] };
}

export function updateTodo(todos: readonly Todo[], id: number, rawText: string): UpdateResult {
  const checked = checkText(rawText);
  if (!checked.ok) return checked;
  if (!todos.some((todo) => todo.id === id)) return { ok: false, reason: 'not-found' };
  return {
    ok: true,
    todos: todos.map((todo) => (todo.id === id ? { ...todo, text: checked.text } : todo)),
  };
}

export function toggleTodo(todos: readonly Todo[], id: number): readonly Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

export function removeTodo(todos: readonly Todo[], id: number): readonly Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompleted(todos: readonly Todo[]): readonly Todo[] {
  return todos.filter((todo) => !todo.completed);
}

export function filterTodos(todos: readonly Todo[], filter: TodoFilter): readonly Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.completed);
  if (filter === 'completed') return todos.filter((todo) => todo.completed);
  return [...todos];
}
