import { describe, expect, it } from "vitest";
import { searchBrands } from "@/features/brands/api";
import { stubBrandSearch } from "@tests/features/brands/search";

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
