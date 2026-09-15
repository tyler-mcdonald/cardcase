import { afterEach, describe, expect, it, vi } from "vitest";
import Cookies from "js-cookie";
import { apiFetch, apiRequest } from "@/lib/api";

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

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
