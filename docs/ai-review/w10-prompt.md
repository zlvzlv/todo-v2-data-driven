# W10 任务 3 用的结构化 Prompt（AI 工程化改造）

```text
角色：你是一名资深前端工程师，熟悉 TypeScript 严格模式与 ESLint。

任务：让 npx eslint src/ --ext .ts 从「0 error、1 warning（readSnapshot 的 complexity = 21）」
变成「0 error、0 warning」，同时**不能改变任何业务行为**。

硬性约束（违反任意一条都算失败）：
1. 不允许 eslint-disable / eslint-disable-next-line / /* eslint-disable */ 注释；
2. 不允许用 as any / any / @ts-ignore 绕过类型检查；
3. 不允许调低或删除已有规则（complexity 10、max-depth 3、no-explicit-any: error 均保留原值）；
4. 不允许把代码挪出 lint 范围（不改 .eslintignore、不新建被忽略的文件）；
5. 不允许删掉任何校验分支（包括 v1/v2 老数据迁移、脏数据过滤）；
6. 只允许：拆分函数、抽公共方法、改善命名，行为必须与改造前完全一致。

验收标准：
- npx eslint src/ --ext .ts --max-warnings 0 通过；
- npm run typecheck 通过；
- npm test 全部通过（现有 40 条用例，不许改测试）。
```
