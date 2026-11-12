import { afterEach, describe, expect, it, vi } from "vitest";
import { brandLogoUrl, searchBrands } from "@/features/brands/api";
import { stubBrandSearch } from "./search";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("brandLogoUrl", () => {
  it("builds the logo CDN URL with the client ID", () => {
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "client-123");

    expect(brandLogoUrl("starbucks.com")).toBe(
      "https://cdn.brandfetch.io/domain/starbucks.com/w/64/h/64/fallback/404?c=client-123",
    );
  });

  it("reads the client ID when called", () => {
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "first");
    brandLogoUrl("delta.com");
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "second");

    expect(brandLogoUrl("delta.com")).toContain("?c=second");
  });
});

describe("searchBrands", () => {
  it("searches Brandfetch directly with the client ID", async () => {
    const fetchMock = stubBrandSearch([{ name: "AT&T", domain: "att.com" }]);
    const signal = new AbortController().signal;

    await expect(searchBrands("AT&T", signal)).resolves.toEqual([
      { name: "AT&T", domain: "att.com" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://api.brandfetch.io/v2/search/AT%26T?c=client-123"),
      { signal },
    );
  });

  it("names a nameless brand after its domain", async () => {
    stubBrandSearch([{ name: null, domain: "delta.com" }]);

    await expect(searchBrands("delta")).resolves.toEqual([
      { name: "delta.com", domain: "delta.com" },
    ]);
  });

  it("rejects when the search fails", async () => {
    const fetchMock = stubBrandSearch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    await expect(searchBrands("delta")).rejects.toThrow("(429)");
  });
});
