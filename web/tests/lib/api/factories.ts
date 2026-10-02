import type { Paginated } from "@/lib/api/types";

export function makePage<T>(
  results: T[],
  { count = results.length, hasNext = false } = {},
): Paginated<T> {
  return {
    count,
    next: hasNext
      ? new URL("?page=next", import.meta.env.VITE_API_URL).href
      : null,
    previous: null,
    results,
  };
}
