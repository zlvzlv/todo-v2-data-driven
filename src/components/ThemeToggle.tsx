import { useTheme } from '../context/ThemeContext';

/** 消费者 1：主题切换按钮 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme}>
      {theme === 'light' ? '🌙 切换深色' : '☀️ 切换浅色'}
    </button>
  );
}
