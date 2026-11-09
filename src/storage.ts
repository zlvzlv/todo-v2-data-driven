/**
 * V3.0 版本化存储
 *
 * W9 的 localStorage 里直接存 Todo[]；V3.0 改成 { version, todos, filter }。
 * 老用户升级后必须能自动迁移，否则会被当成"任务全丢了"。
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

export function readSnapshot(raw: unknown): SnapshotReadResult {
  if (raw === null || raw === undefined) {
    return { ok: false, reason: 'empty' };
  }

  let data: unknown = raw;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed === '') {
      return { ok: false, reason: 'empty' };
    }
    try {
      data = JSON.parse(trimmed) as unknown;
    } catch {
      return { ok: false, reason: 'corrupt' };
    }
  }

  // v2（W9 及以前）：localStorage 里直接是一个 Todo[] 数组
  if (Array.isArray(data)) {
    const list: unknown[] = data;
    const todos = list.filter(isTodo);
    return {
      ok: true,
      snapshot: { version: STORAGE_VERSION, todos, filter: 'all' },
      migratedFrom: 2,
    };
  }

  if (typeof data === 'object' && data !== null) {
    const record: Record<string, unknown> = data as Record<string, unknown>;
    const version = record.version;

    // v1（更早的草稿）：{ todos, filter? }，没有 version 字段
    if (version === undefined) {
      if (!Array.isArray(record.todos)) {
        return { ok: false, reason: 'corrupt' };
      }
      const list: unknown[] = record.todos;
      const todos = list.filter(isTodo);
      const filter = isTodoFilter(record.filter) ? record.filter : 'all';
      return {
        ok: true,
        snapshot: { version: STORAGE_VERSION, todos, filter },
        migratedFrom: 1,
      };
    }

    if (typeof version !== 'number' || !Number.isInteger(version)) {
      return { ok: false, reason: 'corrupt' };
    }
    if (version > STORAGE_VERSION) {
      return { ok: false, reason: 'unsupported-version' };
    }

    // v2：{ version: 2, todos, filter? }
    if (version === 2) {
      if (!Array.isArray(record.todos)) {
        return { ok: false, reason: 'corrupt' };
      }
      const list: unknown[] = record.todos;
      const todos = list.filter(isTodo);
      const filter = isTodoFilter(record.filter) ? record.filter : 'all';
      return {
        ok: true,
        snapshot: { version: STORAGE_VERSION, todos, filter },
        migratedFrom: 2,
      };
    }

    // v3：当前版本，字段必须齐全，filter 非法直接判坏数据（不静默兜底）
    if (version === 3) {
      const todosValue = record.todos;
      const filterValue = record.filter;
      if (!Array.isArray(todosValue) || !isTodoFilter(filterValue)) {
        return { ok: false, reason: 'corrupt' };
      }
      const list: unknown[] = todosValue;
      const todos = list.filter(isTodo);
      return {
        ok: true,
        snapshot: { version: STORAGE_VERSION, todos, filter: filterValue },
        migratedFrom: null,
      };
    }

    return { ok: false, reason: 'unsupported-version' };
  }

  return { ok: false, reason: 'corrupt' };
}
