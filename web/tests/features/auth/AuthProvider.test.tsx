import { useState, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import { getSession, logout } from "@/features/auth/api";

vi.mock("@/features/auth/api", () => ({
  getSession: vi.fn(),
  logout: vi.fn(),
}));

const mockedGetSession = vi.mocked(getSession);
const mockedLogout = vi.mocked(logout);

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

describe("AuthProvider", () => {
  it("reports undefined user while the session is loading", () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.user).toBeUndefined();
  });

  it("reports null user when the session has no authenticated user", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it("reports the session user once authenticated", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: { id: "1", email: "test@example.com" } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(result.current.user?.email).toBe("test@example.com"),
    );
  });

  it("reports null user when the session request fails", async () => {
    mockedGetSession.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it("falls back to null if an authenticated response is missing its user", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it("updates the session to null after a logout mutation succeeds", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: { id: "1", email: "test@example.com" } },
    });
    mockedLogout.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(
      () => ({ auth: useAuth(), logout: useLogout() }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.auth.user?.email).toBe("test@example.com"),
    );

    await act(() => result.current.logout.mutateAsync());

    await waitFor(() => expect(result.current.auth.user).toBeNull());
  });
});
