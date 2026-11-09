/**
 * V3.0 存储迁移测试
 * 重点：老数据（v1 对象 / v2 纯数组）必须能迁移，脏数据必须被过滤，坏数据不能崩。
 */
import { describe, expect, it } from 'vitest';
import { readSnapshot, writeSnapshot, STORAGE_VERSION } from './storage';
import type { Todo } from './todo';

const milk: Todo = { id: 1, text: '买牛奶', completed: false };
const report: Todo = { id: 2, text: '写周报', completed: true };

describe('writeSnapshot', () => {
  it('写出来的字符串带 version 与 filter，能被 JSON.parse', () => {
    const raw = writeSnapshot({ version: STORAGE_VERSION, todos: [milk], filter: 'active' });
    const parsed = JSON.parse(raw) as { version: number; todos: Todo[]; filter: string };
    expect(parsed.version).toBe(STORAGE_VERSION);
    expect(parsed.todos).toEqual([milk]);
    expect(parsed.filter).toBe('active');
  });
});

describe('readSnapshot —— 空值与坏数据', () => {
  it('null / undefined / 空串 都返回 empty', () => {
    expect(readSnapshot(null)).toEqual({ ok: false, reason: 'empty' });
    expect(readSnapshot(undefined)).toEqual({ ok: false, reason: 'empty' });
    expect(readSnapshot('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('坏 JSON 返回 corrupt，不抛错', () => {
    expect(readSnapshot('{oops')).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('不认识的类型（数字）返回 corrupt', () => {
    expect(readSnapshot(42)).toEqual({ ok: false, reason: 'corrupt' });
  });
});

describe('readSnapshot —— 老数据迁移', () => {
  it('v2（W9 纯数组）能迁移，filter 兜底为 all', () => {
    const raw = JSON.stringify([milk, report]);
    const result = readSnapshot(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFrom).toBe(2);
    expect(result.snapshot.version).toBe(STORAGE_VERSION);
    expect(result.snapshot.todos).toEqual([milk, report]);
    expect(result.snapshot.filter).toBe('all');
  });

  it('v1（{ todos } 无 version）能迁移，filter 非法时兜底 all', () => {
    const raw = JSON.stringify({ todos: [milk], filter: 'bogus' });
    const result = readSnapshot(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFrom).toBe(1);
    expect(result.snapshot.todos).toEqual([milk]);
    expect(result.snapshot.filter).toBe('all');
  });

  it('v2 对象格式能迁移并保留 filter', () => {
    const raw = JSON.stringify({ version: 2, todos: [report], filter: 'completed' });
    const result = readSnapshot(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFrom).toBe(2);
    expect(result.snapshot.filter).toBe('completed');
  });

  it('迁移时过滤掉脏数据（缺字段 / id 类型不对）', () => {
    const raw = JSON.stringify([
      milk,
      { id: '2', text: 'id 是字符串', completed: false },
      { id: 3, text: '缺 completed' },
    ]);
    const result = readSnapshot(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.todos).toEqual([milk]);
  });
});

describe('readSnapshot —— v3 当前版本', () => {
  it('合法 v3 数据直接读取，不标记迁移', () => {
    const raw = JSON.stringify({ version: 3, todos: [milk, report], filter: 'active' });
    const result = readSnapshot(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFrom).toBeNull();
    expect(result.snapshot.todos).toEqual([milk, report]);
    expect(result.snapshot.filter).toBe('active');
  });

  it('v3 的 filter 非法时判 corrupt（不静默兜底）', () => {
    const raw = JSON.stringify({ version: 3, todos: [milk], filter: 'bogus' });
    expect(readSnapshot(raw)).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('版本号高于 3（未来版本）返回 unsupported-version', () => {
    const raw = JSON.stringify({ version: 9, todos: [milk], filter: 'all' });
    expect(readSnapshot(raw)).toEqual({ ok: false, reason: 'unsupported-version' });
  });
});
