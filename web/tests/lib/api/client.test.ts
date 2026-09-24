import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("parses and returns the JSON body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: "Thing" }), {
          status: 200,
        }),
      ),
    );

    await expect(request("GET", "https://api.test/things/1")).resolves.toEqual({
      id: 1,
      name: "Thing",
    });
  });

  it("resolves to null without a body on a 204 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(
      request("DELETE", "https://api.test/things/1"),
    ).resolves.toBeNull();
  });

  it("throws ApiError with status and parsed body on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 404,
        }),
      ),
    );

    await expect(
      request("GET", "https://api.test/things"),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      body: { detail: "Not found" },
    });
  });

  it("wraps a network failure into ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      request("GET", "https://api.test/things"),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
