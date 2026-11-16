/**
 * Todo V3.0 DOM 层（实验二 Part 3 增强版）
 *
 * 在 V3.0 基础上新增两个功能（全部走纯函数 + 单测）：
 *   1. 关键字搜索 + 实时统计：search.ts 的 filterByKeyword / buildSearchView；
 *   2. 拖拽排序 + 持久化：order.ts 的 moveTodo / canMove。
 * 组件里只负责读 DOM / 调纯函数 / 写 DOM，业务规则不进 UI 层。
 */

import {
  MAX_TEXT_LENGTH,
  addTodo,
  filterTodos,
  nextId,
  parseTodoId,
  removeTodo,
  toggleTodo,
  updateTodo,
  type Todo,
  type TodoFilter,
} from './todo';
import { canMove, moveTodo } from './order';
import { buildSearchView, formatStats } from './search';
import { STORAGE_VERSION, readSnapshot, writeSnapshot, type TodoSnapshot } from './storage';

const STORAGE_KEY = 'todo-app-v3';
/** W9 及以前的 key：存的是裸数组，升级时要迁移过来 */
const LEGACY_STORAGE_KEY = 'todo-app-v2';
/** 搜索条件单独持久化（需求：刷新后保留搜索条件） */
const KEYWORD_STORAGE_KEY = 'todo-app-v3-keyword';

type ElementGuard<T extends HTMLElement> = (el: HTMLElement) => el is T;

/** 拿到必需元素，缺失就直接抛错；用类型守卫收窄，而不是用 any 断言 */
function requireElement<T extends HTMLElement>(id: string, guard: ElementGuard<T>): T {
  const el = document.getElementById(id);
  if (el === null || !guard(el)) {
    throw new Error(`缺少必需元素：#${id}`);
  }
  return el;
}

const isInput = (el: HTMLElement): el is HTMLInputElement => el instanceof HTMLInputElement;
const isButton = (el: HTMLElement): el is HTMLButtonElement => el instanceof HTMLButtonElement;
const isList = (el: HTMLElement): el is HTMLUListElement => el instanceof HTMLUListElement;
const isParagraph = (el: HTMLElement): el is HTMLParagraphElement =>
  el instanceof HTMLParagraphElement;

const inputEl = requireElement('todo-input', isInput);
const addBtn = requireElement('add-btn', isButton);
const searchEl = requireElement('search-input', isInput);
const statsEl = requireElement('stats', isParagraph);
const listEl = requireElement('todo-list', isList);
const messageEl = requireElement('message', isParagraph);
const emptyStateEl = requireElement('empty-state', isParagraph);

const filterButtons: HTMLButtonElement[] = [];
for (const el of document.querySelectorAll('[data-filter]')) {
  if (el instanceof HTMLButtonElement) filterButtons.push(el);
}

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

function persistKeyword(value: string): void {
  try {
    localStorage.setItem(KEYWORD_STORAGE_KEY, value);
  } catch (error: unknown) {
    console.error('[Todo] 保存搜索条件失败', error);
  }
}

function loadKeyword(): string {
  return readStorage(KEYWORD_STORAGE_KEY) ?? '';
}

/** 优先读 v3；读不到就回退读 W9 的 v2 key，迁移成功后立刻写回新 key */
function loadStartupState(): StartupState {
  const raw = readStorage(STORAGE_KEY) ?? readStorage(LEGACY_STORAGE_KEY);
  const result = readSnapshot(raw);
  if (!result.ok) {
    return { todos: [], filter: 'all' };
  }
  if (result.migratedFrom !== null) {
    persist(result.snapshot);
  }
  return { todos: result.snapshot.todos, filter: result.snapshot.filter };
}

const startup = loadStartupState();
let todos: readonly Todo[] = startup.todos;
let activeFilter: TodoFilter = startup.filter;
let keyword: string = loadKeyword();
/** 当前正在拖拽的任务 id，null 表示没有拖拽进行中 */
let draggingId: number | null = null;

function showMessage(text: string): void {
  messageEl.textContent = text;
}

function createActionButton(label: string, action: 'edit' | 'delete'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = action === 'delete' ? 'delete-btn' : 'edit-btn';
  button.textContent = label;
  button.dataset.action = action;
  button.setAttribute('aria-label', action === 'delete' ? '删除这条待办' : '编辑这条待办');
  return button;
}

function createRow(todo: Todo): HTMLLIElement {
  const li = document.createElement('li');
  li.className = todo.completed ? 'todo-item completed' : 'todo-item';
  li.dataset.id = String(todo.id);
  li.draggable = true;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', '切换完成状态');

  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text; // 用 textContent 而不是 innerHTML，天然防 XSS

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '⋮⋮';
  dragHandle.setAttribute('aria-hidden', 'true');

  li.append(
    dragHandle,
    checkbox,
    span,
    createActionButton('编辑', 'edit'),
    createActionButton('删除', 'delete'),
  );
  return li;
}

function render(): void {
  listEl.replaceChildren();
  const searched = buildSearchView(todos, keyword);
  const visible = filterTodos(searched.visible, activeFilter);
  for (const todo of visible) {
    listEl.append(createRow(todo));
  }
  statsEl.textContent = formatStats({ ...searched, visible, visibleCount: visible.length });
  emptyStateEl.style.display = visible.length > 0 ? 'none' : 'block';
  for (const button of filterButtons) {
    button.classList.toggle('active', button.dataset.filter === activeFilter);
  }
}

function commit(nextTodos: readonly Todo[]): void {
  todos = nextTodos;
  persist({ version: STORAGE_VERSION, todos, filter: activeFilter });
  render();
}

function handleAdd(): void {
  const result = addTodo(todos, inputEl.value, nextId(todos));
  if (!result.ok) {
    showMessage(
      result.reason === 'too-long'
        ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字`
        : '请输入内容后再添加',
    );
    inputEl.focus();
    return;
  }
  commit(result.todos);
  inputEl.value = '';
  showMessage('');
  inputEl.focus();
}

function handleToggle(id: number): void {
  commit(toggleTodo(todos, id));
}

function handleRemove(id: number): void {
  commit(removeTodo(todos, id));
}

function handleEdit(id: number): void {
  const target = todos.find((todo) => todo.id === id);
  if (target === undefined) return;
  const newText = window.prompt('修改任务内容：', target.text);
  if (newText === null) return;
  const result = updateTodo(todos, id, newText);
  if (!result.ok) {
    showMessage(
      result.reason === 'too-long' ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字` : '内容不能为空',
    );
    return;
  }
  commit(result.todos);
  showMessage('');
}

/** 列表交互统一交给父容器 ul：先找 li 拿 id，再看 [data-action] 决定动作 */
function handleListClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const li = event.target.closest('li[data-id]');
  if (!(li instanceof HTMLLIElement) || !listEl.contains(li)) return;
  const id = parseTodoId(li.dataset.id);
  if (id === null) return;
  const actionEl = event.target.closest('[data-action]');
  if (!(actionEl instanceof HTMLElement)) return;
  switch (actionEl.dataset.action) {
    case 'toggle':
      handleToggle(id);
      break;
    case 'delete':
      handleRemove(id);
      break;
    case 'edit':
      handleEdit(id);
      break;
    default:
      break;
  }
}

function handleFilterClick(event: MouseEvent): void {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const { filter } = event.currentTarget.dataset;
  if (filter !== 'all' && filter !== 'active' && filter !== 'completed') return;
  activeFilter = filter;
  persist({ version: STORAGE_VERSION, todos, filter: activeFilter });
  render();
}

/** 搜索框输入：关键字是独立 state，只影响视图，不改 todos */
function handleSearchInput(): void {
  keyword = searchEl.value;
  persistKeyword(keyword);
  render();
}

/** 拖拽开始：记录被拖任务 id，并做目标元素 / id 的边界防御 */
function handleDragStart(event: DragEvent): void {
  if (!(event.target instanceof Element)) return;
  const li = event.target.closest('li[data-id]');
  if (!(li instanceof HTMLLIElement) || !listEl.contains(li)) return;
  const id = parseTodoId(li.dataset.id);
  if (id === null) return;
  draggingId = id;
  li.classList.add('dragging');
  if (event.dataTransfer !== null) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
  }
}

/** 拖拽经过：只做视觉反馈，真正重排在 drop 里一次性完成 */
function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  if (!(event.target instanceof Element)) return;
  const li = event.target.closest('li[data-id]');
  if (!(li instanceof HTMLLIElement) || !listEl.contains(li)) return;
  const targetId = parseTodoId(li.dataset.id);
  if (!canMove(draggingId, targetId)) return;
  for (const item of listEl.querySelectorAll('.drop-target')) {
    item.classList.remove('drop-target');
  }
  li.classList.add('drop-target');
}

/** 拖拽释放：调 moveTodo 生成新数组并持久化，页面顺序即新顺序 */
function handleDrop(event: DragEvent): void {
  event.preventDefault();
  if (!(event.target instanceof Element)) return;
  const li = event.target.closest('li[data-id]');
  if (!(li instanceof HTMLLIElement) || !listEl.contains(li)) return;
  const targetId = parseTodoId(li.dataset.id);
  const fromId = draggingId;
  draggingId = null;
  li.classList.remove('drop-target');
  if (fromId === null || targetId === null) return;
  if (!canMove(fromId, targetId)) return;
  commit(moveTodo(todos, fromId, targetId));
}

/** 拖拽取消 / 结束：兜底清理拖拽样式，避免残留 */
function handleDragEnd(): void {
  draggingId = null;
  for (const item of listEl.querySelectorAll('.dragging, .drop-target')) {
    item.classList.remove('dragging', 'drop-target');
  }
}

addBtn.addEventListener('click', handleAdd);
inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return; // 拼音输入法回车不算提交
  if (event.key === 'Enter') handleAdd();
});
searchEl.addEventListener('input', handleSearchInput);
listEl.addEventListener('click', handleListClick);
listEl.addEventListener('dragstart', handleDragStart);
listEl.addEventListener('dragover', handleDragOver);
listEl.addEventListener('drop', handleDrop);
listEl.addEventListener('dragend', handleDragEnd);
for (const button of filterButtons) {
  button.addEventListener('click', handleFilterClick);
}

searchEl.value = keyword;
render();
