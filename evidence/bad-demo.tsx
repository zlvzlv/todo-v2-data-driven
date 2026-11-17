import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * 任务 3 的「有问题的 AI 持久化逻辑」复现页（演示用，不参与正式构建）：
 * - 读取放在 useEffect 里（而不是 useState 惰性初始化）；
 * - 写入 Effect 依赖 todos，挂载时带着初始 [] 先跑一次 → 覆盖 localStorage；
 * - StrictMode 下 Effect 双执行，第二次读取时读到的已经是被覆盖的空数组 → 数据真丢。
 */
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function BadApp() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h3>bad-persistence demo（靶子代码）</h3>
      <p id="count">当前列表条数：{todos.length}</p>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <BadApp />
    </StrictMode>,
  );
}
