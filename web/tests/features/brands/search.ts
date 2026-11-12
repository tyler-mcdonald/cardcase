import { vi } from "vitest";

export type BrandResult = { name: string | null; domain: string };

export function stubBrandSearch(results: BrandResult[] = []) {
  vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "client-123");
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(results), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function searchedQueries(fetchMock: ReturnType<typeof stubBrandSearch>) {
  return fetchMock.mock.calls.map(([url]) =>
    decodeURIComponent(new URL(String(url)).pathname.split("/").pop()!),
  );
}
