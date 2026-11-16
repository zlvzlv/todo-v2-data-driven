import { describe, expect, it } from 'vitest';
import { buildSearchView, filterByKeyword, formatStats, normalizeKeyword } from './search';
import type { Todo } from './todo';

const milk: Todo = { id: 1, text: '买牛奶', completed: false };
const report: Todo = { id: 2, text: '写周报', completed: true };
const coffee: Todo = { id: 3, text: 'Milk Coffee', completed: false };
const todos: readonly Todo[] = [milk, report, coffee];

describe('normalizeKeyword', () => {
  it('去掉首尾空格', () => {
    expect(normalizeKeyword('  牛奶  ')).toBe('牛奶');
  });

  it('纯空白归一成空串（搜索框边界防御）', () => {
    expect(normalizeKeyword('    ')).toBe('');
    expect(normalizeKeyword('\t\n')).toBe('');
  });
});

describe('filterByKeyword', () => {
  it('空关键字返回全部（且是新数组）', () => {
    const visible = filterByKeyword(todos, '');
    expect(visible).toHaveLength(3);
    expect(visible).not.toBe(todos);
  });

  it('纯空格等同于没有关键字', () => {
    expect(filterByKeyword(todos, '   ')).toHaveLength(3);
  });

  it('按关键字过滤（中文包含匹配）', () => {
    expect(filterByKeyword(todos, '牛奶')).toEqual([milk]);
  });

  it('匹配不区分大小写', () => {
    expect(filterByKeyword(todos, 'milk')).toEqual([coffee]);
    expect(filterByKeyword(todos, 'MILK')).toEqual([coffee]);
  });

  it('没有匹配时返回空数组', () => {
    expect(filterByKeyword(todos, '不存在的任务')).toEqual([]);
  });

  it('不修改原数组', () => {
    filterByKeyword(todos, '牛奶');
    expect(todos).toHaveLength(3);
    expect(todos[0]).toBe(milk);
  });
});

describe('buildSearchView / formatStats', () => {
  it('统计口径为「当前视图 / 总计」', () => {
    const view = buildSearchView(todos, '牛奶');
    expect(view.keyword).toBe('牛奶');
    expect(view.visibleCount).toBe(1);
    expect(view.totalCount).toBe(3);
    expect(formatStats(view)).toBe('当前视图 1 条 / 总计 3 条');
  });

  it('搜索时 todos 本身不变（独立 state 的核心保证）', () => {
    const before = [...todos];
    buildSearchView(todos, '牛奶');
    expect([...todos]).toEqual(before);
  });
});
