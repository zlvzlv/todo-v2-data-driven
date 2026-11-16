import { describe, expect, it } from 'vitest';
import { canMove, moveTodo } from './order';
import type { Todo } from './todo';

const a: Todo = { id: 1, text: '任务A', completed: false };
const b: Todo = { id: 2, text: '任务B', completed: false };
const c: Todo = { id: 3, text: '任务C', completed: false };
const todos: readonly Todo[] = [a, b, c];

describe('moveTodo', () => {
  it('把后面的任务拖到最前面', () => {
    expect(moveTodo(todos, 3, 1).map((todo) => todo.id)).toEqual([3, 1, 2]);
  });

  it('把最前面的任务拖到最后面', () => {
    expect(moveTodo(todos, 1, 3).map((todo) => todo.id)).toEqual([2, 3, 1]);
  });

  it('相邻交换位置', () => {
    expect(moveTodo(todos, 1, 2).map((todo) => todo.id)).toEqual([2, 1, 3]);
  });

  it('fromId 与 toId 相同时顺序不变，但返回新数组', () => {
    const next = moveTodo(todos, 2, 2);
    expect(next.map((todo) => todo.id)).toEqual([1, 2, 3]);
    expect(next).not.toBe(todos);
  });

  it('不存在的 id 返回原顺序，不抛错', () => {
    expect(moveTodo(todos, 99, 1).map((todo) => todo.id)).toEqual([1, 2, 3]);
    expect(moveTodo(todos, 1, 99).map((todo) => todo.id)).toEqual([1, 2, 3]);
  });

  it('不可变：不修改原数组，元素对象引用保持不变', () => {
    const next = moveTodo(todos, 3, 1);
    expect(todos.map((todo) => todo.id)).toEqual([1, 2, 3]);
    expect(next[1]).toBe(a);
    expect(next[2]).toBe(b);
    expect(next[1]).toBe(todos[0]);
  });

  it('空数组上移动不报错', () => {
    expect(moveTodo([], 1, 2)).toEqual([]);
  });
});

describe('canMove', () => {
  it('正常的两个不同 id 允许移动', () => {
    expect(canMove(1, 2)).toBe(true);
  });

  it('相同 id / null / 非法数字 / 非正数都判无效', () => {
    expect(canMove(1, 1)).toBe(false);
    expect(canMove(null, 2)).toBe(false);
    expect(canMove(1, null)).toBe(false);
    expect(canMove(Number.NaN, 2)).toBe(false);
    expect(canMove(1, 1.5)).toBe(false);
    expect(canMove(0, 2)).toBe(false);
  });
});
