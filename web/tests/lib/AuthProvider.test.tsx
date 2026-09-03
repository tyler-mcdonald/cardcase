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

async function renderAuthWithSession(initialSession: ApiResponse) {
  mockedApiRequest.mockResolvedValueOnce(initialSession);
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.status).not.toBe("loading"));
  return result;
}

async function runAction<T>(action: () => Promise<T>) {
  let actionResult!: T;
  await act(async () => {
    actionResult = await action();
  });
  return actionResult;
}

describe("AuthProvider", () => {
  describe("when the session starts unauthenticated", () => {
    let auth: Awaited<ReturnType<typeof renderAuthWithSession>>;

    beforeEach(async () => {
      auth = await renderAuthWithSession(anonymousSession());
    });

    it("reports anonymous status with no user", () => {
      expect(auth.current.status).toBe("anonymous");
      expect(auth.current.user).toBeNull();
    });

    it("confirmLoginCode applies the session and reports ok on success", async () => {
      mockedApiRequest.mockResolvedValueOnce(
        authenticatedSession("test@example.com"),
      );

      const actionResult = await runAction(() =>
        auth.current.confirmLoginCode("123456"),
      );

      expect(actionResult).toEqual({ ok: true });
      expect(auth.current.status).toBe("authenticated");
      expect(auth.current.user?.email).toBe("test@example.com");
    });

    it("confirmLoginCode returns the error message on failure", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        status: 400,
        errors: [{ message: "Incorrect code." }],
      });

      const actionResult = await runAction(() =>
        auth.current.confirmLoginCode("000000"),
      );

      expect(actionResult).toEqual({ ok: false, error: "Incorrect code." });
    });

    it("returns a generic error when the request throws", async () => {
      mockedApiRequest.mockRejectedValueOnce(new Error("network down"));

      const actionResult = await runAction(() =>
        auth.current.requestLoginCode("test@example.com"),
      );

      expect(actionResult).toEqual({ ok: false, error: GENERIC_ERROR });
    });
  });

  describe("when the session starts authenticated", () => {
    let auth: Awaited<ReturnType<typeof renderAuthWithSession>>;

    beforeEach(async () => {
      auth = await renderAuthWithSession(
        authenticatedSession("test@example.com"),
      );
    });

    it("reports authenticated status with the session user", () => {
      expect(auth.current.status).toBe("authenticated");
      expect(auth.current.user?.email).toBe("test@example.com");
    });

    it("logout resets the session to anonymous", async () => {
      mockedApiRequest.mockResolvedValueOnce(anonymousSession());

      await runAction(() => auth.current.logout());

      expect(auth.current.status).toBe("anonymous");
      expect(auth.current.user).toBeNull();
    });
  });
});
