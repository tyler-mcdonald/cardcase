import { afterEach, describe, expect, it, vi } from "vitest";
import Cookies from "js-cookie";
import {
  apiErrorMessage,
  apiFetch,
  apiRequest,
  request,
  ApiError,
  GENERIC_ERROR,
} from "@/lib/api";

vi.mock("js-cookie", () => ({
  default: { get: vi.fn() },
}));

const mockedGet = vi.mocked(
  Cookies.get as (name: string) => string | undefined,
);

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("issues a GET request without content-type or CSRF headers", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchSpy);

    await apiFetch("/v1/accounts");

    const [url, options] = fetchSpy.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://localhost:8000/v1/accounts");
    expect(options.credentials).toBe("include");
    const headers = options.headers as Headers;
    expect(headers.get("X-CSRFToken")).toBeNull();
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("attaches the CSRF token and content-type on mutating requests", async () => {
    mockedGet.mockReturnValue("test-csrf-token");
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchSpy);

    await apiFetch("/v1/accounts", { method: "POST", body: "{}" });

    const [, options] = fetchSpy.mock.calls[0] as [URL, RequestInit];
    const headers = options.headers as Headers;
    expect(headers.get("X-CSRFToken")).toBe("test-csrf-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("omits the CSRF header on mutating requests when no cookie is set", async () => {
    mockedGet.mockReturnValue(undefined);
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchSpy);

    await apiFetch("/v1/accounts", { method: "DELETE" });

    const [, options] = fetchSpy.mock.calls[0] as [URL, RequestInit];
    const headers = options.headers as Headers;
    expect(headers.get("X-CSRFToken")).toBeNull();
  });
});

describe("apiRequest", () => {
  it("parses the JSON response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ status: 200, data: { ok: true } })),
    );

    const result = await apiRequest("/_allauth/browser/v1/auth/session");

    expect(result).toEqual({ status: 200, data: { ok: true } });
  });
});

describe("request", () => {
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
