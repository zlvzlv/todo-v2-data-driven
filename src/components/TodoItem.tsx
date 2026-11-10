import type { Todo } from '../todo';

export interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (id: number) => void;
  readonly onRemove: (id: number) => void;
  readonly onEdit: (id: number) => void;
}

/** 单条待办：只接收数据 + 回调，不碰父组件状态 */
export default function TodoItem({ todo, onToggle, onRemove, onEdit }: TodoItemProps) {
  return (
    <li className={todo.completed ? 'todo-item completed' : 'todo-item'}>
      <input
        type="checkbox"
        checked={todo.completed}
        aria-label="切换完成状态"
        onChange={() => {
          onToggle(todo.id);
        }}
      />
      <span className="todo-text">{todo.text}</span>
      <button
        type="button"
        className="edit-btn"
        onClick={() => {
          onEdit(todo.id);
        }}
      >
        编辑
      </button>
      <button
        type="button"
        className="delete-btn"
        aria-label="删除这条待办"
        onClick={() => {
          onRemove(todo.id);
        }}
      >
        删除
      </button>
    </li>
  );
}
