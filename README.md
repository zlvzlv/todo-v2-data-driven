# Todo V4.0 · React 组件重构

在 V3.0（TS + Vite + ESLint + 版本化存储 + 40 条单测）的基础上完成 V4.0：
把原生 DOM 版本迁移成真正的 React 组件化版本，并做单测回归 + 真实浏览器行为验证。

- **组件拆分**：`TodoApp`（唯一持有 state）/ `TodoForm` / `TodoList` / `TodoItem`，
  数据向下传（props）、事件向上传（回调）。
- **State 驱动**：`useState` 管理 `todos / filter`，增删改全部走 `todo.ts` 纯函数做不可变更新，
  组件里没有任何 DOM 查询或 `innerHTML`。
- **双轨验证**：`npm test` 40 条全绿（轨道 A）+ 真实 Edge 无头浏览器操作页面并比对
  state 与 DOM（轨道 B，日志见 `docs/ai-review/w11-ui-console.log`）。
- **AI「假 React」审查**：AI 的修复版仍有 DOM 操作、对象变异、空值校验丢失三类残留，
  业务规则用例 3 条全红（`w11-ai-fix-tests.log`），人工拒绝后重写。

## 目录

```text
src/
  components/
    TodoApp.tsx            根组件：useState + 增删改 + 启动迁移 + 持久化
    TodoForm.tsx           受控输入 + 提交回调（Enter 兼容中文输入法）
    TodoList.tsx           列表：空态 / 映射 TodoItem
    TodoItem.tsx           单条：checkbox + 文本 + 编辑/删除按钮
  main.tsx                 React 挂载入口（createRoot + StrictMode）
  todo.ts                  数据层纯函数（addTodo/toggleTodo/updateTodo/...）
  storage.ts               V3 版本化存储 + v1/v2 数据迁移
  storage.test.ts          存储迁移测试 11 条
  todo.test.ts             手写单测 16 条
  todo.ai.patched.test.ts  审查 AI 生成测试后修补的 13 条
  styles.css               样式
docs/ai-review/
  w11-prompt.md            任务 3 的结构化 Prompt（不许保留 DOM 操作/变异）
  w11-ai-fix.tsx           AI「假 React」修复版原稿（留档，不参与构建）
  w11-ai-fix-tests.log     AI 版业务规则用例 3 failed 的真实日志
  w11-review.md            范式残留 / 业务行为 / 处置结论
  w11-ui-console.log       CDP 捕获的页面控制台 state 与 UI 操作结果
  w10-*.md / w10-*.log     W10 工程化审查证据（历史）
  prompt.md                W9 测试审查 Prompt（历史）
index.html                 Vite 入口（只留 #root + main.tsx）
```

## 运行

```bash
npm install
npm run test          # vitest run，40 条用例
npm run typecheck     # tsc --noEmit（strict + noUncheckedIndexedAccess）
npm run lint          # eslint src --ext .ts,.tsx
npm run format:check  # prettier --check
npm run build         # tsc --noEmit && vite build
npm run dev           # 本地起 Vite（http://localhost:5173/）
```

## React 重构要点

1. **单一数据源**：`todos` / `filter` 只存在于 `TodoApp`；子组件只拿 props、只调回调，
   不在组件里各自存一份列表副本。
2. **不可变更新**：`setTodos(addTodo(todos, text, nextId(todos)))` 这种写法，
   而不是 `todos.push(...)` 或改 `t.completed`；纯函数 `todo.ts` 同时被单测覆盖。
3. **业务逻辑不进组件**：空值/超长校验、id 生成、toggle 逻辑都在 `todo.ts`，
   所以从 DOM 版迁到 React 版时，40 条单测一行没改就全绿 —— 这就是"业务逻辑没被 UI 框架绑架"。
4. **受控组件**：`TodoForm` 的输入框 `value + onChange` 成对；回车提交兼容拼音输入法的 `isComposing`。
5. **持久化**：`TodoApp` 用 `useEffect` 在 `todos/filter` 变化时写入版本化快照，
   启动时走 `readSnapshot` 迁移 W9 老数据。
6. **DOM 自查**：全项目只有 `main.tsx` 的 `document.getElementById('root')` 挂载点一处，
   `src/components` 下 0 处 DOM 查询 / `innerHTML` / 对象变异。
