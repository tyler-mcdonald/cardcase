import { useState, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, GENERIC_ERROR } from "@/lib/AuthProvider";
import { useAuth } from "@/lib/use-auth";
import { request, ApiError, type ApiResponse } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    request: vi.fn(),
  };
});

const mockedRequest = vi.mocked(request);

const TEST_EMAIL = "test@example.com";

function Wrapper({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

function anonymousSessionResponse(): ApiResponse {
  return { status: 200, meta: { is_authenticated: false } };
}

function authenticatedSessionResponse(email: string): ApiResponse {
  return {
    status: 200,
    meta: { is_authenticated: true },
    data: { user: { id: "1", email } },
  };
}

async function renderAuthWithSession(initialSession: ApiResponse) {
  mockedRequest.mockResolvedValueOnce(initialSession);
  const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.status).not.toBe("loading"));
  return result;
}

type AuthResult = Awaited<ReturnType<typeof renderAuthWithSession>>;

async function runAction<T>(action: () => Promise<T>) {
  let actionResult!: T;
  await act(async () => {
    actionResult = await action();
  });
  return actionResult;
}

describe("when the session starts unauthenticated", () => {
  let auth: AuthResult;

  beforeEach(async () => {
    auth = await renderAuthWithSession(anonymousSessionResponse());
  });

  it("reports anonymous status with no user", () => {
    expect(auth.current.status).toBe("anonymous");
    expect(auth.current.user).toBeNull();
  });

  it("returns ok and correctly sets user context", async () => {
    mockedRequest.mockResolvedValueOnce(
      authenticatedSessionResponse(TEST_EMAIL),
    );

    const actionResult = await runAction(() =>
      auth.current.confirmLoginCode("123456"),
    );

    expect(actionResult).toEqual({ ok: true });
    await waitFor(() => expect(auth.current.status).toBe("authenticated"));
    expect(auth.current.user?.email).toBe(TEST_EMAIL);
  });

  it("returns error for an incorrect login code", async () => {
    mockedRequest.mockRejectedValueOnce(
      new ApiError("Bad Request", 400, {
        status: 400,
        errors: [{ message: "Incorrect code." }],
      }),
    );

    const actionResult = await runAction(() =>
      auth.current.confirmLoginCode("000000"),
    );

    expect(actionResult).toEqual({ ok: false, error: "Incorrect code." });
  });

  it("returns a generic error when the request throws", async () => {
    mockedRequest.mockRejectedValueOnce(new Error("network down"));

    const actionResult = await runAction(() =>
      auth.current.requestLoginCode(TEST_EMAIL),
    );

    expect(actionResult).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});

describe("when the session starts authenticated", () => {
  let auth: AuthResult;

  beforeEach(async () => {
    auth = await renderAuthWithSession(
      authenticatedSessionResponse(TEST_EMAIL),
    );
  });

  it("reports authenticated status with the session user", () => {
    expect(auth.current.status).toBe("authenticated");
    expect(auth.current.user?.email).toBe(TEST_EMAIL);
  });

  it("logout resets the session to anonymous", async () => {
    mockedRequest.mockResolvedValueOnce(anonymousSessionResponse());

    await runAction(() => auth.current.logout());

    await waitFor(() => expect(auth.current.status).toBe("anonymous"));
    expect(auth.current.user).toBeNull();
  });
});
