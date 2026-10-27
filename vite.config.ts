import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // threads 池启动比 fork 快，纯函数测试不需要进程级隔离
    pool: 'threads',
  },
});
