import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // threads 池启动比 fork 快，纯函数测试不需要进程级隔离
    pool: 'threads',
  },
});
