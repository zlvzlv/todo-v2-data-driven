import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import TodoApp from './components/TodoApp';
import './styles.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('缺少 #root 挂载节点');
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <TodoApp />
    </ThemeProvider>
  </StrictMode>,
);
