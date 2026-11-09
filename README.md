# Todo V3.0 · TypeScript 工程化收尾

在 W9（V2.0 TS 重构 + 单测）的基础上完成 V3.0 工程化收尾：

- **版本化存储与数据迁移**：localStorage 从裸 `Todo[]` 升级为 `{ version, todos, filter }`，
  兼容 v1/v2 老数据自动迁移（`src/storage.ts` + 11 条迁移单测）。
- **Vite 工程脚本**：`build = tsc --noEmit && vite build`、`test = vitest run`，
  另加 `typecheck / lint / format`。
- **ESLint + Prettier + strict**：`.eslintrc.cjs` 保留 `complexity: 10`、`max-depth: 3`、
  `@typescript-eslint/no-explicit-any: error` 三条规则，`npx eslint src/ --ext .ts` 0 problem。
- **AI 改造审查**：AI 用 `eslint-disable` / `.eslintignore` / 删迁移分支"过检查"，
  人工审查后拒绝并重写（过程见 `docs/ai-review/`）。

## 目录

```text
src/
  todo.ts                  数据层纯函数（Todo 接口、类型守卫、addTodo/toggleTodo/...）
  storage.ts               V3.0 版本化存储 + v1/v2 数据迁移（按版本路由，函数均在复杂度 10 以内）
  storage.test.ts          存储迁移测试 11 条
  main.ts                  DOM 层（事件委托、dataset.id 转 number、null 安全、启动时迁移旧数据）
  styles.css               样式
  todo.test.ts             手写单测 16 条（addTodo / toggleTodo）
  todo.ai.patched.test.ts  审查 AI 生成测试后修补的 13 条
docs/ai-review/
  w10-prompt.md            W10 结构化 Prompt（含"不许规避"约束）
  w10-ai-refactor.diff     AI 改造版完整 diff（审查对象）
  w10-ai-refactor.log      AI 改造版：ESLint 0 problem、测试 2 failed 的真实日志
  w10-review.md            规避行为审查 / 业务行为验证 / 处置结论
  w10-final-checks.log     最终版 lint + test + build 的真实日志
  prompt.md                W9 任务 3 的 Prompt（历史记录）
index.html                 Vite 入口
```

## 运行

```bash
npm install
npm run test          # vitest run，40 条用例
npm run typecheck     # tsc --noEmit（strict + noUncheckedIndexedAccess）
npm run lint          # eslint src --ext .ts
npm run format:check  # prettier --check
npm run build         # tsc --noEmit && vite build
npm run dev           # 本地起 Vite（http://localhost:5173/）
```

> 注意：ESLint 8 默认只扫 `.js`，扫 TS 要加 `--ext .ts`；`npm run dev` 是看页面的唯一方式，
> 直接双击 `index.html` 会因为 ESM + TS 被浏览器拦下。

## 工程化要点

1. **版本化存储**：`readSnapshot` 只负责"路由"，`parseRawInput / routeSnapshot /
readLegacyArray / readLegacyV1 / readVersionedV2 / readCurrentV3` 各自解析一种格式，
   每个函数圈复杂度都 < 10，没有 `eslint-disable`。
2. **迁移不丢数据**：W9 的裸数组、v1 的 `{ todos }`、v2 的 `{ version: 2, todos }`
   都能迁移到 v3；脏数据由 `isTodo` 过滤；坏 JSON 返回 `corrupt` 不抛错。
3. **迁移后写回新 key**：`main.ts` 在启动时读到旧 key（`todo-app-v2`）会迁移并写回
   `todo-app-v3`。
4. **strict 与 any**：`tsc --noEmit` 0 error，`src/` 下没有 `: any` / `as any`；
   ESLint 的 `no-explicit-any` 是 error 级别。
5. **AI 审查结论**：AI 的"过检查"方案被拒绝——比 ESLint 通过更重要的，
   是 `npm test` 40 条仍然全绿、老用户数据仍然能迁移。
