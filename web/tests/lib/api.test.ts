import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiErrorMessage,
  isClientError,
  request,
  ApiError,
  GENERIC_ERROR,
} from "@/lib/api";

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

describe("apiErrorMessage", () => {
  it("returns the specific message from an ApiError's body", () => {
    const error = new ApiError("Bad Request", 400, {
      status: 400,
      errors: [{ message: "Incorrect code." }],
    });

    expect(apiErrorMessage(error)).toBe("Incorrect code.");
  });

  it("falls back to a generic message for an ApiError with no body message", () => {
    const error = new ApiError("Server Error", 500);

    expect(apiErrorMessage(error)).toBe(GENERIC_ERROR);
  });

  it("falls back to a generic message for a non-ApiError", () => {
    expect(apiErrorMessage(new Error("network down"))).toBe(GENERIC_ERROR);
  });
});

describe("isClientError", () => {
  it("is true for a 4xx API error", () => {
    expect(isClientError(new ApiError("Not found", 404))).toBe(true);
  });

  it("is false for a 5xx API error", () => {
    expect(isClientError(new ApiError("Server error", 500))).toBe(false);
  });

  it("is false for a network failure", () => {
    expect(isClientError(new ApiError("Network error"))).toBe(false);
  });

  it("is false for a non-API error", () => {
    expect(isClientError(new Error("boom"))).toBe(false);
  });
});
