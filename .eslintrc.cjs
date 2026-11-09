module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    // 本周的三条硬性规则
    complexity: ['warn', 10],
    'max-depth': ['warn', 3],
    '@typescript-eslint/no-explicit-any': 'error',
    // TS 已经负责未定义标识符检查，避免对类型引用误报
    'no-undef': 'off',
  },
};
