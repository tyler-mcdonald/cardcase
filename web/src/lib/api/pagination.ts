import { hasApiStatus } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/types";

export function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function totalPages(response: Paginated<unknown>, page: number): number {
  return response.next
    ? Math.ceil(response.count / response.results.length)
    : page;
}

type Page<T> = {
  items: T[];
  totalPages: number;
};

export function toPage<T>(response: Paginated<T>, page: number): Page<T> {
  return {
    items: response.results,
    totalPages: totalPages(response, page),
  };
}

export function isMissingPage(error: unknown): boolean {
  return hasApiStatus(error, 404);
}
