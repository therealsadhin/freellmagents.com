export type ModelPageCursors = Record<number, string>;

const emptyCursors: ModelPageCursors = {};
const snapshots = new Map<string, ModelPageCursors>();
const listeners = new Map<string, Set<() => void>>();

export function getModelPageCursors(key: string): ModelPageCursors {
  if (typeof window === "undefined") return emptyCursors;
  const cached = snapshots.get(key);
  if (cached) return cached;

  const cursors: ModelPageCursors = {};
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null) {
        for (const [page, cursor] of Object.entries(parsed)) {
          if (/^\d+$/.test(page) && typeof cursor === "string") {
            cursors[Number(page)] = cursor;
          }
        }
      }
    }
  } catch (error) {
    console.warn("Could not restore model page cursors.", error);
  }
  snapshots.set(key, cursors);
  return cursors;
}

export function subscribeToModelPageCursors(
  key: string,
  onChange: () => void,
) {
  const keyListeners = listeners.get(key) ?? new Set<() => void>();
  keyListeners.add(onChange);
  listeners.set(key, keyListeners);
  return () => {
    keyListeners.delete(onChange);
    if (keyListeners.size === 0) listeners.delete(key);
  };
}

export function saveModelPageCursor(
  key: string,
  page: number,
  cursor: string,
) {
  const next = { ...getModelPageCursors(key), [page]: cursor };
  snapshots.set(key, next);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    console.warn("Could not save model page navigation.", error);
  }
  for (const listener of listeners.get(key) ?? []) listener();
}

export function getEmptyModelPageCursors() {
  return emptyCursors;
}
