import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { SearchResult } from "@/features/brands/api";

function stubSearch(respond: (query: string) => SearchResult[] | undefined) {
  vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "client-123");
  const fetchMock = vi.fn<typeof fetch>(async (url) => {
    const results = respond(searchedQuery(url));
    return results
      ? new Response(JSON.stringify(results), { status: 200 })
      : new Promise<Response>(() => {});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function stubBrandSearch(results: SearchResult[] = []) {
  return stubSearch(() => results);
}

export function stubBrandSearchByQuery(
  resultsByQuery: Record<string, SearchResult[]>,
) {
  return stubSearch((query) => resultsByQuery[query]);
}

function searchedQuery(url: Parameters<typeof fetch>[0]) {
  return decodeURIComponent(new URL(String(url)).pathname.split("/").pop()!);
}

export function searchedQueries(fetchMock: ReturnType<typeof stubBrandSearch>) {
  return fetchMock.mock.calls.map(([url]) => searchedQuery(url));
}

export async function pickBrand(query: string) {
  fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
    target: { value: query },
  });
  fireEvent.click(await screen.findByRole("option"));
}
