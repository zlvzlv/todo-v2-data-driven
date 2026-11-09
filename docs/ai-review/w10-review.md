# W10 AI 工程化改造审查记录

审查对象：`ai/v3-eslint-refactor` 分支上的「AI 改造版」（`src/storage.ts` + `src/storage-legacy.ts` + `.eslintignore`）。

## ① 规避行为审查

| 类型           | AI 的实际做法                                                                       | 是否违规                 |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| eslint-disable | 在 `readSnapshot` 上加 `/* eslint-disable complexity */` 把复杂度 16 的告警直接压掉 | 违规（约束 1）           |
| 挪出 lint 范围 | 新建 `src/storage-legacy.ts` 装 v1/v2 读取逻辑，并写进 `.eslintignore`              | 违规（约束 4）           |
| 删掉校验分支   | 删除了「localStorage 里是裸数组（v2/W9 格式）」的分支，理由写的是"临时格式已没人用" | 违规（约束 5）且改坏业务 |

结论：AI 本质上是「让 ESLint 看不见问题」，而不是把复杂度降下来。

## ② 业务行为验证

业务规则：**W9 用户升级到 V3.0 后，原来的任务不能丢**（W9 存的是裸 `Todo[]`）。

- AI 改造后：`readSnapshot` 收到裸数组时走不到迁移分支，直接判 `corrupt`，页面会变成空白 → 规则失效。
- 验证方式：跑单测（`npm test`），`storage.test.ts` 里 2 条红了：
  - `v2（W9 纯数组）能迁移，filter 兜底为 all`
  - `迁移时过滤掉脏数据（缺字段 / id 类型不对）`
- 单测红了就足以证明"老数据迁移"这条业务规则被改坏，不需要再靠手动点页面确认。

## ③ 处置：部分接受

- 接受：把「版本号路由」和「各版本解析」拆成小函数的结构思路（最终版沿用）；
- 拒绝：`eslint-disable`、`.eslintignore` 排除文件、删除 v2 裸数组分支；
- 修正：把 AI 的 `storage-legacy.ts` 合并回 `src/storage.ts`，拆成 `parseRawInput / routeSnapshot / readLegacyArray / readLegacyV1 / readVersionedV2 / readCurrentV3` 等小函数，全部纳入 lint 范围；
- 结果：`npx eslint src/ --ext .ts --max-warnings 0` 0 problem，`npm test` 40 条全绿（日志见 `w10-final-checks.log`）。

## 证据文件

- `w10-ai-refactor.log`：AI 改造版「ESLint 0 problem + 测试 2 failed」的真实终端输出
- `w10-ai-refactor.diff`：AI 改造的完整 diff
- `w10-final-checks.log`：最终版 lint / test / build 的真实终端输出
