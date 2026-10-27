/**
 * Todo V2.0 DOM 层
 *
 * 只负责「读 DOM → 调数据层 → 写 DOM」，业务规则全部在 todo.ts 里。
 * 这里的 null 安全靠 requireElement 的类型守卫收窄，全程不使用 any。
 */

import {
  MAX_TEXT_LENGTH,
  addTodo,
  filterTodos,
  nextId,
  parseTodoId,
  parseTodos,
  removeTodo,
  toggleTodo,
  updateTodo,
  type Todo,
  type TodoFilter,
} from './todo';

const STORAGE_KEY = 'todo-app-v2';

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
const isParagraph = (el: HTMLElement): el is HTMLParagraphElement => el instanceof HTMLParagraphElement;

const inputEl = requireElement('todo-input', isInput);
const addBtn = requireElement('add-btn', isButton);
const listEl = requireElement('todo-list', isList);
const messageEl = requireElement('message', isParagraph);
const emptyStateEl = requireElement('empty-state', isParagraph);

const filterButtons: HTMLButtonElement[] = [];
for (const el of document.querySelectorAll('[data-filter]')) {
  if (el instanceof HTMLButtonElement) filterButtons.push(el);
}

let todos: readonly Todo[] = loadTodos();
let activeFilter: TodoFilter = 'all';

function saveTodos(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error: unknown) {
    console.error('[Todo] 保存失败', error);
  }
}

function loadTodos(): readonly Todo[] {
  try {
    return parseTodos(localStorage.getItem(STORAGE_KEY));
  } catch (error: unknown) {
    console.error('[Todo] 读取失败', error);
    return [];
  }
}

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

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', '切换完成状态');

  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text; // 用 textContent 而不是 innerHTML，天然防 XSS

  li.append(checkbox, span, createActionButton('编辑', 'edit'), createActionButton('删除', 'delete'));
  return li;
}

function render(): void {
  listEl.replaceChildren();
  const visible = filterTodos(todos, activeFilter);
  for (const todo of visible) {
    listEl.append(createRow(todo));
  }
  emptyStateEl.style.display = visible.length > 0 ? 'none' : 'block';
  for (const button of filterButtons) {
    button.classList.toggle('active', button.dataset.filter === activeFilter);
  }
}

function commit(nextTodos: readonly Todo[]): void {
  todos = nextTodos;
  saveTodos();
  render();
}

function handleAdd(): void {
  const result = addTodo(todos, inputEl.value, nextId(todos));
  if (!result.ok) {
    showMessage(result.reason === 'too-long' ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字` : '请输入内容后再添加');
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
    showMessage(result.reason === 'too-long' ? `单条内容不能超过 ${MAX_TEXT_LENGTH} 字` : '内容不能为空');
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
  render();
}

addBtn.addEventListener('click', handleAdd);
inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return; // 拼音输入法回车不算提交
  if (event.key === 'Enter') handleAdd();
});
listEl.addEventListener('click', handleListClick);
for (const button of filterButtons) {
  button.addEventListener('click', handleFilterClick);
}

render();
