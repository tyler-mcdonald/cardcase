import { afterEach, describe, expect, it, vi } from "vitest";
import { requestLoginCode, logout } from "@/features/auth/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetchResponse(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

describe("requestLoginCode", () => {
  it("resolves on allauth's expected 401 pending-flow response", async () => {
    const body = {
      status: 401,
      data: { flows: [{ id: "login_by_code", is_pending: true }] },
      meta: { is_authenticated: false },
    };
    stubFetchResponse(401, body);

    await expect(requestLoginCode("me@example.com")).resolves.toEqual(body);
  });

  it("still rejects on a real failure like rate limiting", async () => {
    const body = { status: 400, errors: [{ code: "too_many_login_attempts" }] };
    stubFetchResponse(400, body);

    await expect(requestLoginCode("me@example.com")).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("logout", () => {
  it("resolves on allauth's expected 401 logged-out response", async () => {
    const body = { status: 401, meta: { is_authenticated: false } };
    stubFetchResponse(401, body);

    await expect(logout()).resolves.toEqual(body);
  });
});
