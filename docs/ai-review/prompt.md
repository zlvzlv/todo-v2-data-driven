# 任务 3 用的结构化 Prompt（存档）

发给 AI（DeepSeek）的原始提问：

```text
角色：你是一名熟悉 Vitest + TypeScript 的前端测试工程师。

任务：为 src/todo.ts 里的 addTodo、toggleTodo、parseTodoId 三个函数写单元测试。

已知信息：
- 被测代码是纯函数模块，不碰 DOM、不读 localStorage；
- addTodo(todos, rawText, id) 返回 { ok: true, todo, todos } 或 { ok: false, reason }；
  reason 的取值：'empty' | 'too-long' | 'invalid-id' | 'duplicate-id' | 'not-found'；
- toggleTodo(todos, id) 返回新的 todo 数组，不修改入参数组；
- parseTodoId(raw) 把 dataset.id 这类字符串转成 number，非法返回 null。

约束（必须遵守）：
1. 严禁 any / as any / @ts-ignore，测试代码也要通过 tsc --strict；
2. 不要 mock 内部实现，只测公开行为；
3. 每条 it 只验证一件事，断言必须落到具体字段（id/text/completed/ok/reason），
   不允许只断言 length、toBeTruthy、not.toThrow 这种"恒真"断言；
4. 必须覆盖：空值、纯空格、100 字上限（99/100/101）、非法 id、不存在的 id、
   入参数组不被修改；
5. 再写出 2 个你认为本业务容易漏掉的边界；
6. 只输出代码，不要解释，文件从 './todo' 导入，使用 describe / it / expect。
```

> 说明：即便 Prompt 里第 3 条明确禁止，AI 仍然交回了 `toBeTruthy()`、`toHaveLength()`、
> `not.toThrow()` 这类弱断言，还用了 `as any` —— 这正是任务 3 要做人工审查的原因。
