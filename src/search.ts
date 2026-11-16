/**
 * V3 增强功能 1：关键字搜索与实时统计（纯函数，可单测）
 *
 * 业务规则：
 * - 关键字用独立 state 管理，搜索只产出"视图数组"，绝不改动 todos 本身；
 * - 关键字首尾空格要被忽略（纯空格 = 没有关键字 = 显示全部）；
 * - 匹配不区分大小写；
 * - 统计口径：当前视图条数 / 总条数。
 */
import type { Todo } from './todo';

export interface SearchView {
  /** 规范化后的关键字（已 trim） */
  readonly keyword: string;
  readonly visible: readonly Todo[];
  readonly visibleCount: number;
  readonly totalCount: number;
}

/** 去除首尾空格；纯空白统一变成空串（搜索框的边界防御） */
export function normalizeKeyword(raw: string): string {
  return raw.trim();
}

/** 按关键字过滤（不修改入参），空关键字返回全部 */
export function filterByKeyword(todos: readonly Todo[], rawKeyword: string): readonly Todo[] {
  const keyword = normalizeKeyword(rawKeyword).toLowerCase();
  if (keyword === '') return [...todos];
  return todos.filter((todo) => todo.text.toLowerCase().includes(keyword));
}

/** 一次性产出"视图 + 统计"，避免 UI 里自己再算一遍导致口径不一致 */
export function buildSearchView(todos: readonly Todo[], rawKeyword: string): SearchView {
  const keyword = normalizeKeyword(rawKeyword);
  const visible = filterByKeyword(todos, keyword);
  return {
    keyword,
    visible,
    visibleCount: visible.length,
    totalCount: todos.length,
  };
}

export function formatStats(view: SearchView): string {
  return `当前视图 ${view.visibleCount} 条 / 总计 ${view.totalCount} 条`;
}
