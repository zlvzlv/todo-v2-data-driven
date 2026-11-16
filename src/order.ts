/**
 * V3 增强功能 2：拖拽排序（纯函数，可单测）
 *
 * 业务规则：
 * - 重排必须遵守不可变原则：返回新数组，原数组和其中的对象都不许被改；
 * - 把 fromId 移动到 toId 的位置（插到 toId 之前）；
 * - id 不存在 / 相同 / 非法时返回原顺序的浅拷贝，不抛错。
 */
import type { Todo } from './todo';

/**
 * 把 fromId 对应的任务移动到 toId 对应任务的位置。
 * @param todos 原数组（不会被修改）
 * @param fromId 被拖动的任务 id
 * @param toId 目标位置的任务 id
 */
export function moveTodo(todos: readonly Todo[], fromId: number, toId: number): readonly Todo[] {
  const snapshot = [...todos];
  if (fromId === toId) return snapshot;
  const fromIndex = todos.findIndex((todo) => todo.id === fromId);
  const toIndex = todos.findIndex((todo) => todo.id === toId);
  if (fromIndex < 0 || toIndex < 0) return snapshot;

  const next = [...todos];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) return snapshot;
  next.splice(toIndex, 0, moved);
  return next;
}

/** 校验拖拽的起点/终点 id 是否可用（NaN、非正数、相同 id 都判无效） */
export function canMove(fromId: number | null, toId: number | null): boolean {
  if (fromId === null || toId === null) return false;
  if (!Number.isInteger(fromId) || !Number.isInteger(toId)) return false;
  if (fromId <= 0 || toId <= 0) return false;
  return fromId !== toId;
}
