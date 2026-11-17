import { useTheme } from '../context/ThemeContext';

/** 消费者 2：在统计栏里显示当前主题，证明多个组件共享同一份 Context 状态 */
export default function ThemeStatus() {
  const { theme } = useTheme();
  return <span className="theme-status">当前主题：{theme === 'light' ? '浅色' : '深色'}</span>;
}
