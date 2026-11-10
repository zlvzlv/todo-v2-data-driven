// AI 对模板里「假 React」靶子代码的修复版（审查对象，不是最终代码）。
// 它把 listRef + push 改成了 [...todos]，看起来"修好了"，但仍有 3 类残留：
//   ① 仍然用 document.getElementById + innerHTML 直接操作 DOM；
//   ② handleToggle 原地修改 todo 对象，并且 setTodos(todos) 传的是同一个引用，React 不会重新渲染；
//   ③ 为了"简化"，把 text.trim() === '' 改成了 !text，导致纯空格也能添加。
import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  let listRef: Todo[] = [];

  function handleAdd() {
    if (!text) return; // ← 原来的 trim 校验被简化掉了，纯空格能通过
    const newTodo = { id: Date.now(), text, completed: false };
    listRef = todos;
    listRef.push(newTodo); // ← 仍然在改原数组，只是用新数组包了一层
    setTodos([...listRef]);
    const listEl = document.getElementById('todo-list'); // ← 残留：手动 DOM 操作
    if (listEl) {
      listEl.innerHTML += `<li>${newTodo.text}</li>`; // ← 残留：innerHTML 拼接
    }
    setText('');
  }

  function handleToggle(id: number) {
    todos.map((t) => {
      if (t.id === id) {
        t.completed = !t.completed; // ← 对象原地变异
      }
    });
    setTodos(todos); // ← 同一个引用，React 不会重新渲染
  }

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleAdd}>添加</button>
      <ul id="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => handleToggle(todo.id)}>
            {todo.text} {todo.completed ? '✔' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
