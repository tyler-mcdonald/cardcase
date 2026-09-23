import { useState, type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/use-auth";
import { getSession } from "@/features/auth/api";

vi.mock("@/features/auth/api", () => ({
  getSession: vi.fn(),
}));

const mockedGetSession = vi.mocked(getSession);

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
  it("reports anonymous status with no user when the session has no user", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.user).toBeNull();
  });

  it("reports authenticated status with the session user", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: { id: "1", email: "test@example.com" } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user?.email).toBe("test@example.com");
  });

  it("reports anonymous status when the session request fails", async () => {
    mockedGetSession.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.user).toBeNull();
  });
});
