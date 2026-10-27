/**
 * 手写单元测试（任务 2，不依赖 AI）
 * 只覆盖两个核心函数：addTodo 与 toggleTodo，正常情况 + 边界拦截。
 */
import { describe, expect, it } from 'vitest';
import { MAX_TEXT_LENGTH, addTodo, toggleTodo, type Todo } from './todo';

const milk: Todo = { id: 1, text: '买牛奶', completed: false };
const report: Todo = { id: 2, text: '写周报', completed: true };

describe('addTodo —— 正常情况', () => {
  it('新增任务时写入 trim 后的文本，completed 默认 false', () => {
    const result = addTodo([], '  买牛奶  ', 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0]).toEqual({ id: 1, text: '买牛奶', completed: false });
  });

  it('新任务追加在已有任务后面，不覆盖旧数据', () => {
    const result = addTodo([milk], '写周报', 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos.map((todo) => todo.id)).toEqual([1, 2]);
    expect(result.todos[0]).toBe(milk);
  });

  it('不修改传入的原数组（纯函数）', () => {
    const original: Todo[] = [milk];
    addTodo(original, '写周报', 2);
    expect(original).toHaveLength(1);
    expect(original[0]).toBe(milk);
  });

  it('文案相同但 id 不同时允许新增（业务允许重复文案）', () => {
    const result = addTodo([milk], '买牛奶', 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos).toHaveLength(2);
  });
});

describe('addTodo —— 边界拦截', () => {
  it('空字符串被拦截', () => {
    expect(addTodo([], '', 1)).toEqual({ ok: false, reason: 'empty' });
  });

  it('只输入空格（trim 后为空）被拦截', () => {
    expect(addTodo([], '   ', 1)).toEqual({ ok: false, reason: 'empty' });
  });

  it('恰好 100 个字可以添加（上限本身是合法值）', () => {
    const text = '待'.repeat(MAX_TEXT_LENGTH);
    const result = addTodo([], text, 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos[0]?.text).toHaveLength(MAX_TEXT_LENGTH);
  });

  it('第 101 个字被拦截（越界上界）', () => {
    expect(addTodo([], '待'.repeat(MAX_TEXT_LENGTH + 1), 1)).toEqual({ ok: false, reason: 'too-long' });
  });

  it('id 已存在时被拦截，原有数据不变', () => {
    expect(addTodo([milk], '写周报', 1)).toEqual({ ok: false, reason: 'duplicate-id' });
  });

  it('id 不是正整数时被拦截', () => {
    expect(addTodo([], '买牛奶', 0)).toEqual({ ok: false, reason: 'invalid-id' });
    expect(addTodo([], '买牛奶', 1.5)).toEqual({ ok: false, reason: 'invalid-id' });
  });
});

describe('toggleTodo', () => {
  it('未完成 → 已完成', () => {
    const result = toggleTodo([milk], 1);
    expect(result[0]?.completed).toBe(true);
  });

  it('已完成 → 未完成', () => {
    const result = toggleTodo([report], 2);
    expect(result[0]?.completed).toBe(false);
  });

  it('只翻转目标任务，其它任务对象引用不变', () => {
    const result = toggleTodo([milk, report], 1);
    expect(result[0]?.completed).toBe(true);
    expect(result[1]).toBe(report);
  });

  it('不修改传入的原数组（纯函数）', () => {
    const original: Todo[] = [milk];
    toggleTodo(original, 1);
    expect(original[0]?.completed).toBe(false);
  });

  it('id 不存在时原样返回，不抛错', () => {
    expect(toggleTodo([milk, report], 999)).toEqual([milk, report]);
  });

  it('id 为 NaN 时不抛错且没有任何变化', () => {
    expect(toggleTodo([milk], Number.NaN)).toEqual([milk]);
  });
});
