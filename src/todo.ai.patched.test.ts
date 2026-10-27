/**
 * 修补后的 AI 测试（任务 3 ③）
 * 相比原稿：删掉类型逃逸的强制转换、补上真实断言、按 9 维度补齐 parseTodoId 与 parseTodos 的边界。
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_TEXT_LENGTH,
  addTodo,
  parseTodoId,
  parseTodos,
  toggleTodo,
  type Todo,
} from './todo';

const milk: Todo = { id: 1, text: '买牛奶', completed: false };

describe('修补 AI 测试 —— addTodo', () => {
  it('新增后返回的数据内容正确（不能只看数量）', () => {
    const result = addTodo([], '写周报', 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos).toEqual([{ id: 1, text: '写周报', completed: false }]);
    expect(result.todo.text).toBe('写周报');
  });

  it('空内容被明确拦截，而不是静默返回旧数组', () => {
    expect(addTodo([], '   ', 1)).toEqual({ ok: false, reason: 'empty' });
  });

  it('第 101 个字被拦截（AI 漏掉的越界点）', () => {
    expect(addTodo([], 'x'.repeat(MAX_TEXT_LENGTH + 1), 1)).toEqual({ ok: false, reason: 'too-long' });
  });

  it('传入的数组不会被修改（AI 原来只测了长度）', () => {
    const original: Todo[] = [milk];
    addTodo(original, '写周报', 2);
    expect(original).toEqual([milk]);
  });
});

describe('修补 AI 测试 —— toggleTodo', () => {
  it('只翻转目标任务，其它任务引用不变', () => {
    const other: Todo = { id: 2, text: '写周报', completed: true };
    const result = toggleTodo([milk, other], 1);
    expect(result[0]?.completed).toBe(true);
    expect(result[1]).toBe(other);
  });

  it('id 不存在时不改动任何数据', () => {
    expect(toggleTodo([milk], 999)).toEqual([milk]);
  });

  it('原数组保持不变', () => {
    const original: Todo[] = [milk];
    toggleTodo(original, 1);
    expect(original).toEqual([milk]);
  });
});

describe('修补 AI 测试 —— parseTodoId（补类型/格式维度）', () => {
  it('合法数字字符串转成 number', () => {
    expect(parseTodoId('12')).toBe(12);
    expect(parseTodoId(' 7 ')).toBe(7);
  });

  it('null / undefined / 空串返回 null', () => {
    expect(parseTodoId(null)).toBeNull();
    expect(parseTodoId(undefined)).toBeNull();
    expect(parseTodoId('')).toBeNull();
    expect(parseTodoId('   ')).toBeNull();
  });

  it('非数字、小数、0、负数都返回 null（避免 NaN 进业务层）', () => {
    for (const raw of ['abc', '12.5', '0', '-3']) {
      expect(parseTodoId(raw)).toBeNull();
    }
  });
});

describe('修补 AI 测试 —— parseTodos（补依赖/脏数据维度）', () => {
  it('坏 JSON 返回空数组且不抛错', () => {
    expect(parseTodos('{oops')).toEqual([]);
  });

  it('不是数组的值返回空数组', () => {
    expect(parseTodos(null)).toEqual([]);
    expect(parseTodos('{"todos":[]}')).toEqual([]);
    expect(parseTodos(42)).toEqual([]);
  });

  it('过滤掉缺字段 / 类型不对的脏数据', () => {
    const raw = JSON.stringify([
      { id: 1, text: '正常数据', completed: false },
      { id: '2', text: 'id 是字符串', completed: false },
      { id: 3, text: '缺 completed' },
      { id: 4, text: '正常数据 2', completed: true },
    ]);
    expect(parseTodos(raw).map((todo) => todo.id)).toEqual([1, 4]);
  });
});
