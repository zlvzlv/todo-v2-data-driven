import type { Todo } from '../todo';
import TodoItem from './TodoItem';

export interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly onToggle: (id: number) => void;
  readonly onRemove: (id: number) => void;
  readonly onEdit: (id: number) => void;
}

/** 纯展示组件：把 todos 映射成 TodoItem，事件原样向上抛 */
export default function TodoList({ todos, onToggle, onRemove, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty-state">暂无待办事项</p>;
  }
  return (
    <ul id="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
