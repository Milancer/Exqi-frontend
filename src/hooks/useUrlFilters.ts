import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Hook that syncs filter values with URL search-params.
 *
 * @param keys – the param names to manage (other params in the URL are preserved)
 *
 * Usage:
 *   const { get, set, clear, clearAll } = useUrlFilters(["role", "status", "search"]);
 *   <Select value={get("role")} onChange={(v) => set("role", v)} clearable />
 */
export function useUrlFilters(keys: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Read a single filter value (null when absent). */
  const get = useCallback(
    (key: string): string | null => searchParams.get(key),
    [searchParams],
  );

  /** Set a single filter value.  Pass `null` to remove it. */
  const set = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Clear one filter. */
  const clear = useCallback((key: string) => set(key, null), [set]);

  /** Clear all managed filters (keeps other unrelated params). */
  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      },
      { replace: true },
    );
  }, [keys, setSearchParams]);

  return { get, set, clear, clearAll } as const;
}
