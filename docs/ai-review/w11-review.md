# W11 任务 3 审查记录：AI「假 React」修复是否彻底

审查对象：`docs/ai-review/w11-ai-fix.tsx`（AI 修复版），对照模板里的靶子代码。

## ① 范式残留审查：AI 修全了吗？——没有，残留 7 处（已排除注释行）

| 坑              | 原始问题                                                                                   | AI 修了吗？                                                                        | 证据（AI 修复后对应代码） |
| --------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------- |
| 手动 DOM 操作   | `document.getElementById('todo-list')` + `innerHTML += '<li>…'` 拼列表                     | 没修，原样保留                                                                     | 第 25、27 行              |
| 数组原地修改    | `listRef = todos; listRef.push(newTodo)` 直接改 state 数组                                 | 只修了一半：`setTodos([...listRef])` 包了一层新数组，但 `listRef` 中转和 push 还在 | 第 17、22-24 行           |
| toggle 对象变异 | `todos.map(t => { t.completed = !t.completed })` 改原对象，再 `setTodos(todos)` 传同一引用 | 没修                                                                               | 第 32-38 行               |

## ② 业务行为验证：原来的规则还在吗？——不在

把 AI 修复版里的 `handleAdd` / `handleToggle` 逻辑原样搬进临时测试用例验证，
3 条业务规则用例全部红了（日志：`w11-ai-fix-tests.log`）：

1. **纯空格不能添加**：AI 把 `text.trim() === ''` 改成了 `!text`，输入 `'   '` 会被当成合法任务；
2. **toggle 不能修改原数组里的对象**：AI 版直接回写 `t.completed`，原对象被改掉；
3. **toggle 后必须返回新数组**：AI 版返回的还是同一个引用，React 不会重新渲染，点"完成"页面没反应。

验证方式：`npx vitest run src/w11-ai-fix.test.ts`（3 failed）+ 对照 diff 阅读代码。

## ③ 我的处置：拒绝 AI 版，按约束重写

- 拒绝：AI 版只在"添加"上做了表面修复，DOM 操作、对象变异、空值校验三处仍然违反约束；
- 重写：拆成 `TodoApp / TodoForm / TodoList / TodoItem` 四个组件，
  state 只在 `TodoApp` 里，更新全部走 `todo.ts` 的纯函数（`addTodo / toggleTodo / removeTodo / updateTodo`），
  保证不可变更新、业务规则与 V3 完全一致；
- 验证：全项目 grep `innerHTML|querySelector|document.getElementById` 只剩 `main.tsx` 的挂载点 1 处，
  `src/components` 下 0 处；`npm test` 40 条全绿；页面用真实浏览器操作（添加/勾选/删除）验证 state 驱动。

## 证据文件

- `w11-ai-fix.tsx`：AI 修复版原稿（留档，不参与构建）
- `w11-ai-fix-tests.log`：业务规则用例 3 failed 的真实终端输出
