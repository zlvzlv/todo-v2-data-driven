# AI 生成测试的原稿（审查对象，存档）

> 这份原稿**不参与** `npm test`，只作为任务 3 的审查证据保留在这里。
> 最终采用、并且全绿的是 `src/todo.ai.patched.test.ts`。
> 原稿运行时临时放在 `src/todo.ai.test.ts`，跑完 8 条用例全绿后被移出 `src/`。

```ts
import { describe, expect, it } from 'vitest';
import { addTodo, parseTodoId, toggleTodo, type Todo } from './todo';

const todos: Todo[] = [{ id: 1, text: '买牛奶', completed: false }];

describe('AI 生成的测试（原稿）', () => {
  it('addTodo 能新增一条任务', () => {
    const result = addTodo([], '写周报', 1) as any;
    expect(result).toBeTruthy();
    expect(result.todos.length).toBe(1);
  });

  it('addTodo 空内容不应该抛错', () => {
    expect(() => addTodo([], '   ', 1)).not.toThrow();
  });

  it('addTodo 超长内容会被拦截', () => {
    const result = addTodo([], 'x'.repeat(120), 2) as any;
    expect(result.ok).toBe(false);
  });

  it('toggleTodo 能把未完成变已完成', () => {
    const result = toggleTodo(todos, 1);
    expect(result[0]?.completed).toBe(true);
  });

  it('toggleTodo 不会改变数组长度', () => {
    expect(toggleTodo(todos, 1).length).toBe(todos.length);
  });

  it('toggleTodo 传不存在的 id 不抛错', () => {
    expect(() => toggleTodo(todos, 999)).not.toThrow();
  });

  it('parseTodoId 能把字符串转成数字', () => {
    expect(parseTodoId('12')).not.toBeNull();
  });

  it('任务数据可以被序列化', () => {
    expect(JSON.stringify(todos)).toContain('买牛奶');
  });
});
```

## 审查结论摘要

- 8 条用例全绿，但只有第 3 条（超长内容）真的能抓到 bug；
- 删掉 `addTodo` 里的 `.trim()` 后，这 8 条**依然全绿**（见 `mutation-experiment.log`）；
- 主要问题：恒真断言（`toBeTruthy` / `not.toThrow` / `length`）、`as any` 绕过类型、
  只断言数量不断言内容、没有覆盖非法 id 与 localStorage 脏数据。
