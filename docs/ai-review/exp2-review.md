# 实验二 Part 3：两轮 AI 生成的审查记录

两个功能都按「第一轮只给功能要求 → 个人独立判断 → 第二轮加工程约束 → 对比定稿」推进。
第一轮 AI 原稿存档：`exp2-round1-search.txt`、`exp2-round1-drag.txt`；最终实现：`src/search.ts`、`src/order.ts`。

## 功能点 1：关键字搜索 + 实时统计

第一轮问题（自己看代码发现，不先问 AI）：

1. `render()` 里把过滤结果写回 `todos` —— 搜索会把数据源改掉，清空关键字后原任务全丢；
2. 关键字没有 `trim()`，纯空格会让列表变空；
3. 统计只有「当前视图」，没有「总计」，口径不符合要求；
4. 没做持久化，刷新后搜索条件丢失；
5. 过滤逻辑嵌在 `render()` 里，无法单独单测。

第二轮约束与结果：

- 纯函数 `filterByKeyword` / `buildSearchView` / `formatStats`，只产出视图、不碰 `todos`；
- 关键字独立 state + 独立 localStorage key（`todo-app-v3-keyword`）；
- 边界：`normalizeKeyword` 统一 trim，纯空白 = 无关键字；
- 统计口径 `totalCount = todos.length`；
- 10 条单测覆盖空关键字 / 纯空格 / 大小写 / 无匹配 / 不可变。

## 功能点 2：拖拽排序 + 持久化

第一轮问题：

1. 直接对 `todos` 原地 `splice`，违反不可变原则，渲染层可能拿到同一引用；
2. 没有校验 from / to 是否存在，`from === to` 时会插到错误位置；
3. 拖拽后没有保存顺序；
4. `bindDrag` 给每个 li 单独绑定，不符合「事件委托」要求。

第二轮约束与结果：

- 纯函数 `moveTodo(todos, fromId, toId)` 返回新数组，`canMove` 校验 id；
- 事件委托：dragstart / dragover / drop / dragend 全部绑定在 `ul` 上；
- 边界：目标缺失 data-id、NaN、相同 id 时静默返回，不抛错；
- `commit()` 统一持久化到版本化快照；
- 9 条单测覆盖前移 / 后移 / 相邻 / 相同 / 不存在 / 不可变 / 空数组。

## 验证证据

- `npx eslint src --ext .ts`：0 problem；
- `npm test`：59 条全绿（新增 search 10 + order 9）；
- `npm run build`：tsc + vite build 通过；
- 真实浏览器（Edge 无头）：搜索「牛奶」→ 视图 1 条、总计 3 条；拖拽第 3 条到第 1 位 → 顺序变化且刷新后保持（捕获记录见 `docs/ai-review/exp2-ui-check.log`）。
