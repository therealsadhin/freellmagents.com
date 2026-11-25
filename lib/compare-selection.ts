const STORAGE_KEY = "freellmagents:model-comparison";
const emptySelection = new Set<string>();
const listeners = new Set<() => void>();
let cachedSelection = emptySelection;
let initialized = false;

export function readCompareSelection(): Set<string> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const values: unknown = JSON.parse(stored);
    return Array.isArray(values)
      ? new Set(
          values.filter((value): value is string => typeof value === "string"),
        )
      : new Set();
  } catch (error) {
    console.warn("Could not read the saved model comparison selection.", error);
    return new Set();
  }
}

export function getCompareSelectionSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    cachedSelection = readCompareSelection();
    initialized = true;
  }
  return cachedSelection;
}

export function getEmptyCompareSelection() {
  return emptySelection;
}

export function subscribeToCompareSelection(onChange: () => void) {
  listeners.add(onChange);
  const handleStorage = () => {
    cachedSelection = readCompareSelection();
    initialized = true;
    for (const listener of listeners) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function writeCompareSelection(ids: Set<string>) {
  cachedSelection = new Set(ids);
  initialized = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.warn("Could not save the model comparison selection.", error);
  }
  for (const listener of listeners) listener();
}
