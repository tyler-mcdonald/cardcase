import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout, useStartDemo } from "@/features/auth/queries";
import { getSession, logout, startDemo } from "@/features/auth/api";
import {
  SESSION_CHANNEL_NAME,
  USER_CHANGED_MESSAGE,
} from "@/features/auth/session-channel";
import { TestProviders } from "@tests/TestProviders";
import { sessionResponse, TEST_USER } from "@tests/features/auth/fixtures";

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
    mockedGetSession.mockResolvedValueOnce(sessionResponse(null));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.user).toBeUndefined();
  });

  it("reports null user when the session has no authenticated user", async () => {
    mockedGetSession.mockResolvedValueOnce(sessionResponse(null));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it("reports the session user once authenticated", async () => {
    mockedGetSession.mockResolvedValueOnce(sessionResponse(TEST_USER));

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
    mockedGetSession.mockResolvedValueOnce(sessionResponse(TEST_USER));
    mockedLogout.mockResolvedValueOnce(sessionResponse(null));

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
    mockedGetSession.mockResolvedValueOnce(sessionResponse(TEST_USER));
    mockedLogout.mockResolvedValueOnce(sessionResponse(null));

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
      .mockResolvedValueOnce(sessionResponse(null))
      .mockResolvedValueOnce(
        sessionResponse({ id: "2", email: "demo@example.com", is_demo: true }),
      );
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
    mockedGetSession.mockResolvedValueOnce(sessionResponse(TEST_USER));
    mockedLogout.mockResolvedValueOnce(sessionResponse(null));

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

  describe("across tabs", () => {
    const otherTabs: BroadcastChannel[] = [];

    function openOtherTab() {
      const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      otherTabs.push(channel);
      return channel;
    }

    afterEach(() => {
      otherTabs.splice(0).forEach((channel) => channel.close());
      vi.unstubAllGlobals();
    });

    function stubReload() {
      const reload = vi.fn();
      vi.stubGlobal("location", { ...window.location, reload });
      return reload;
    }

    it("reloads when another tab changes the session user", async () => {
      const reload = stubReload();
      mockedGetSession.mockResolvedValueOnce(sessionResponse(null));

      renderHook(() => useAuth(), { wrapper: Wrapper });
      openOtherTab().postMessage(USER_CHANGED_MESSAGE);

      await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    });

    it("goes home instead of reloading when another tab changes the user on /demo", async () => {
      const reload = vi.fn();
      const replace = vi.fn();
      vi.stubGlobal("location", {
        ...window.location,
        pathname: "/demo",
        reload,
        replace,
      });
      mockedGetSession.mockResolvedValueOnce(sessionResponse(null));

      renderHook(() => useAuth(), { wrapper: Wrapper });
      openOtherTab().postMessage(USER_CHANGED_MESSAGE);

      await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
      expect(reload).not.toHaveBeenCalled();
    });

    it("tells other tabs, without reloading itself, when the session user changes", async () => {
      const reload = stubReload();
      mockedGetSession.mockResolvedValueOnce(sessionResponse(TEST_USER));
      mockedLogout.mockResolvedValueOnce(sessionResponse(null));
      const received = vi.fn();
      openOtherTab().addEventListener("message", received);

      const { result } = renderHook(
        () => ({ auth: useAuth(), logout: useLogout() }),
        { wrapper: Wrapper },
      );

      await waitFor(() =>
        expect(result.current.auth.user?.email).toBe("test@example.com"),
      );

      result.current.logout.mutate();

      await waitFor(() => expect(received).toHaveBeenCalledTimes(1));
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
