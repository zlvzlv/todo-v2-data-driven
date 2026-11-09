/**
 * V3.0 版本化存储
 *
 * W9 的 localStorage 里直接存 Todo[]；V3.0 改成 { version, todos, filter }。
 * 老用户升级后必须能自动迁移，否则会被当成"任务全丢了"。
 *
 * 复杂度拆分：readSnapshot 只做"路由"，各版本格式的解析各自独立成小函数，
 * 每个函数的圈复杂度都控制在 10 以内（AI 原稿是用 eslint-disable 压掉的，已弃用）。
 */
import { isTodo, type Todo, type TodoFilter } from './todo';

export const STORAGE_VERSION = 3;

export interface TodoSnapshot {
  readonly version: number;
  readonly todos: readonly Todo[];
  readonly filter: TodoFilter;
}

export type SnapshotReadResult =
  | { readonly ok: true; readonly snapshot: TodoSnapshot; readonly migratedFrom: number | null }
  | { readonly ok: false; readonly reason: 'empty' | 'corrupt' | 'unsupported-version' };

const FILTERS: readonly TodoFilter[] = ['all', 'active', 'completed'];

export function isTodoFilter(value: unknown): value is TodoFilter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}

export function writeSnapshot(snapshot: TodoSnapshot): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    todos: snapshot.todos,
    filter: snapshot.filter,
  });
}

interface ParsedInput {
  readonly ok: true;
  readonly value: unknown;
}

type InputReadResult = ParsedInput | { readonly ok: false; readonly reason: 'empty' | 'corrupt' };

function parseRawInput(raw: unknown): InputReadResult {
  if (raw === null || raw === undefined) return { ok: false, reason: 'empty' };
  if (typeof raw !== 'string') return { ok: true, value: raw };
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntegerVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/** 把 unknown 里的 todos 字段安全地转成 Todo[]；不是数组就返回 null */
function readTodoList(value: unknown): readonly Todo[] | null {
  if (!Array.isArray(value)) return null;
  const list: unknown[] = value;
  return list.filter(isTodo);
}

function normalizeFilter(value: unknown): TodoFilter {
  return isTodoFilter(value) ? value : 'all';
}

function buildResult(
  todos: readonly Todo[],
  filter: TodoFilter,
  migratedFrom: number | null,
): SnapshotReadResult {
  return { ok: true, snapshot: { version: STORAGE_VERSION, todos, filter }, migratedFrom };
}

/** v2（W9 及以前）：localStorage 里直接是一个 Todo[] 数组 */
function readLegacyArray(list: unknown[]): SnapshotReadResult {
  return buildResult(list.filter(isTodo), 'all', 2);
}

/** v1（更早的草稿）：{ todos, filter? }，没有 version 字段 */
function readLegacyV1(record: Record<string, unknown>): SnapshotReadResult {
  const todos = readTodoList(record.todos);
  if (todos === null) return { ok: false, reason: 'corrupt' };
  return buildResult(todos, normalizeFilter(record.filter), 1);
}

/** v2 对象格式：{ version: 2, todos, filter? } */
function readVersionedV2(record: Record<string, unknown>): SnapshotReadResult {
  const todos = readTodoList(record.todos);
  if (todos === null) return { ok: false, reason: 'corrupt' };
  return buildResult(todos, normalizeFilter(record.filter), 2);
}

/** v3 当前版本：字段必须齐全，filter 非法直接判坏数据（不静默兜底） */
function readCurrentV3(record: Record<string, unknown>): SnapshotReadResult {
  const todos = readTodoList(record.todos);
  const filter = record.filter;
  if (todos === null || !isTodoFilter(filter)) {
    return { ok: false, reason: 'corrupt' };
  }
  return buildResult(todos, filter, null);
}

function routeSnapshot(data: unknown): SnapshotReadResult {
  if (Array.isArray(data)) {
    const list: unknown[] = data;
    return readLegacyArray(list);
  }
  if (!isPlainRecord(data)) return { ok: false, reason: 'corrupt' };
  const version = data.version;
  if (version === undefined) return readLegacyV1(data);
  if (!isIntegerVersion(version)) return { ok: false, reason: 'corrupt' };
  if (version > STORAGE_VERSION) return { ok: false, reason: 'unsupported-version' };
  if (version === 3) return readCurrentV3(data);
  if (version === 2) return readVersionedV2(data);
  return { ok: false, reason: 'unsupported-version' };
}

export function readSnapshot(raw: unknown): SnapshotReadResult {
  const parsed = parseRawInput(raw);
  if (!parsed.ok) return parsed;
  return routeSnapshot(parsed.value);
}
