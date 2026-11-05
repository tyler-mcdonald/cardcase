import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout, useStartDemo } from "@/features/auth/queries";
import { getSession, logout, startDemo } from "@/features/auth/api";
import { TestProviders } from "@tests/TestProviders";

vi.mock("@/features/auth/api");

const mockedGetSession = vi.mocked(getSession);
const mockedLogout = vi.mocked(logout);
const mockedStartDemo = vi.mocked(startDemo);

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <TestProviders>
      <AuthProvider>{children}</AuthProvider>
    </TestProviders>
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
      data: { user: { id: "1", email: "test@example.com", is_demo: false } },
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
      data: { user: { id: "1", email: "test@example.com", is_demo: false } },
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

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.auth.user).toBeNull());
  });

  it("drops the previous user's cached data when the session user changes", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: { id: "1", email: "test@example.com", is_demo: false } },
    });
    mockedLogout.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(
      () => ({
        auth: useAuth(),
        logout: useLogout(),
        queryClient: useQueryClient(),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.auth.user?.email).toBe("test@example.com"),
    );
    result.current.queryClient.setQueryData(["accounts", 1], ["card"]);

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.auth.user).toBeNull());
    expect(
      result.current.queryClient.getQueryData(["accounts", 1]),
    ).toBeUndefined();
  });

  it("drops anonymous cached data when a user signs in", async () => {
    mockedGetSession
      .mockResolvedValueOnce({
        status: 200,
        meta: { is_authenticated: false },
      })
      .mockResolvedValueOnce({
        status: 200,
        meta: { is_authenticated: true },
        data: { user: { id: "2", email: "demo@example.com", is_demo: true } },
      });
    mockedStartDemo.mockResolvedValueOnce(null);

    const { result } = renderHook(
      () => ({
        auth: useAuth(),
        startDemo: useStartDemo(),
        queryClient: useQueryClient(),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.auth.user).toBeNull());
    result.current.queryClient.setQueryData(["accounts", 1], ["card"]);

    result.current.startDemo.mutate();

    await waitFor(() =>
      expect(result.current.auth.user?.email).toBe("demo@example.com"),
    );
    expect(
      result.current.queryClient.getQueryData(["accounts", 1]),
    ).toBeUndefined();
  });

  it("cancels the previous user's in-flight queries when the session user changes", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: { id: "1", email: "test@example.com", is_demo: false } },
    });
    mockedLogout.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(
      () => ({
        auth: useAuth(),
        logout: useLogout(),
        queryClient: useQueryClient(),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.auth.user?.email).toBe("test@example.com"),
    );
    let signal: AbortSignal | undefined;
    void result.current.queryClient.prefetchQuery({
      queryKey: ["accounts", 1],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise<string[]>(() => {});
      },
    });
    await waitFor(() => expect(signal).toBeDefined());

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.auth.user).toBeNull());
    expect(signal?.aborted).toBe(true);
  });
});
