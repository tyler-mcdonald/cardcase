import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, GENERIC_ERROR } from "@/lib/AuthProvider";
import { useAuth } from "@/lib/use-auth";
import { apiRequest, type ApiResponse } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

function anonymousSession(): ApiResponse {
  return { status: 200, meta: { is_authenticated: false } };
}

function authenticatedSession(email: string): ApiResponse {
  return {
    status: 200,
    meta: { is_authenticated: true },
    data: { user: { id: "1", email } },
  };
}

async function renderAuth(initialSession: ApiResponse) {
  mockedApiRequest.mockResolvedValueOnce(initialSession);
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.status).not.toBe("loading"));
  return result;
}

beforeEach(() => {
  mockedApiRequest.mockReset();
});

describe("AuthProvider", () => {
  it("starts anonymous when the session fetch reports unauthenticated", async () => {
    const auth = await renderAuth(anonymousSession());

    expect(auth.current.status).toBe("anonymous");
    expect(auth.current.user).toBeNull();
  });

  it("becomes authenticated with the session user when the session fetch reports authenticated", async () => {
    const auth = await renderAuth(authenticatedSession("test@example.com"));

    expect(auth.current.status).toBe("authenticated");
    expect(auth.current.user?.email).toBe("test@example.com");
  });

  it("requestLoginCode resolves ok on success", async () => {
    const auth = await renderAuth(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce({ status: 200 });

    let actionResult;
    await act(async () => {
      actionResult = await auth.current.requestLoginCode("test@example.com");
    });

    expect(actionResult).toEqual({ ok: true });
  });

  it("confirmLoginCode applies the session and reports ok on success", async () => {
    const auth = await renderAuth(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce(
      authenticatedSession("test@example.com"),
    );

    let actionResult;
    await act(async () => {
      actionResult = await auth.current.confirmLoginCode("123456");
    });

    expect(actionResult).toEqual({ ok: true });
    expect(auth.current.status).toBe("authenticated");
    expect(auth.current.user?.email).toBe("test@example.com");
  });

  it("confirmLoginCode returns the error and leaves the session unauthenticated", async () => {
    const auth = await renderAuth(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce({
      status: 400,
      errors: [{ message: "Incorrect code." }],
    });

    let actionResult;
    await act(async () => {
      actionResult = await auth.current.confirmLoginCode("000000");
    });

    expect(actionResult).toEqual({ ok: false, error: "Incorrect code." });
    expect(auth.current.status).toBe("anonymous");
  });

  it("logout resets the session to anonymous", async () => {
    const auth = await renderAuth(authenticatedSession("test@example.com"));
    mockedApiRequest.mockResolvedValueOnce(anonymousSession());

    await act(async () => {
      await auth.current.logout();
    });

    expect(auth.current.status).toBe("anonymous");
    expect(auth.current.user).toBeNull();
  });

  it("returns a generic error when the request throws", async () => {
    const auth = await renderAuth(anonymousSession());
    mockedApiRequest.mockRejectedValueOnce(new Error("network down"));

    let actionResult;
    await act(async () => {
      actionResult = await auth.current.requestLoginCode("test@example.com");
    });

    expect(actionResult).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});
