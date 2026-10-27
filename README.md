# Todo V2.0 · TypeScript

把 W8 的 `index.html`（纯 JS、一个 IIFE 包含状态/渲染/事件/存储）重构成 TypeScript，
并补齐单元测试。任务 2 的手写测试在 `src/todo.test.ts`，任务 3 的 AI 测试审查过程在
`docs/ai-review/`。

## 目录

```text
src/
  todo.ts                  数据层纯函数（Todo 接口、类型守卫、addTodo/toggleTodo/...）
  main.ts                  DOM 层（事件委托、dataset.id 转 number、null 安全）
  styles.css               样式
  todo.test.ts             任务 2：手写单测 16 条（addTodo / toggleTodo）
  todo.ai.patched.test.ts  任务 3：审查 AI 生成测试后修补的 13 条
docs/ai-review/
  prompt.md                任务 3 用的结构化 Prompt
  ai-tests-original.md     AI 生成的原稿（留档，不参与测试）
  mutation-experiment.log  有效性审查用的变异实验日志
index.html                 Vite 入口
```

## 运行

```bash
npm install
npm run test        # vitest run，全部用例
npm run typecheck   # tsc --noEmit，strict 模式（含 noUncheckedIndexedAccess）
npm run dev         # 本地起 Vite 调试页面
```

## TypeScript 重构要点

1. **类型约束**：`interface Todo { readonly id: number; readonly text: string; readonly completed: boolean }`，
   过滤条件用 `type TodoFilter = 'all' | 'active' | 'completed'`。
2. **dataset.id 字符串转 number**：`parseTodoId()` 统一转换，非整数/非正数返回 `null`，
   调用方提前 `return`，避免 `NaN` 流进业务逻辑。
3. **消除 null 报错**：`requireElement(id, guard)` 用类型守卫把 `HTMLElement | null`
   收窄成 `HTMLInputElement` 等具体类型；`event.target` 先 `instanceof Element` 再 `closest()`。
4. **严禁 any**：脏数据统一用 `unknown` + `isTodo()` 类型守卫过滤；
   `tsc --noEmit` 在 strict 下 0 error，`src/` 里没有 `: any` / `as any`。
5. **可测性**：把 `Date.now()` 生成 id 改成 `nextId(todos)`；数据层不依赖 DOM / localStorage，
   所以测试不需要 jsdom 和任何 mock。
6. **XSS 边界**：渲染一律用 `textContent`，不拼 `innerHTML`。
