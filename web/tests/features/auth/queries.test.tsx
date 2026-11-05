import { renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useConfirmLoginCode, useLogout } from "@/features/auth/queries";
import { confirmLoginCode, logout } from "@/features/auth/api";
import { makeAccount } from "../accounts/factories";
import { TestProviders } from "../../TestProviders";

vi.mock("@/features/auth/api");

const mockedConfirmLoginCode = vi.mocked(confirmLoginCode);
const mockedLogout = vi.mocked(logout);

const CACHED_ACCOUNTS_KEY = ["accounts", 1];

function renderWithQueryClient<T>(useHook: () => T) {
  return renderHook(
    () => ({ hook: useHook(), queryClient: useQueryClient() }),
    { wrapper: TestProviders },
  );
}

describe("auth queries", () => {
  it("clears cached accounts when logout succeeds", async () => {
    mockedLogout.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: false },
    });
    const { result } = renderWithQueryClient(useLogout);
    result.current.queryClient.setQueryData(CACHED_ACCOUNTS_KEY, [
      makeAccount(),
    ]);

    result.current.hook.mutate();

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(
      result.current.queryClient.getQueryData(CACHED_ACCOUNTS_KEY),
    ).toBeUndefined();
    expect(result.current.queryClient.getQueryData(["session"])).toBeNull();
  });

  it("clears cached accounts when login confirm succeeds", async () => {
    const user = { id: "2", email: "b@example.com" };
    mockedConfirmLoginCode.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user },
    });
    const { result } = renderWithQueryClient(useConfirmLoginCode);
    result.current.queryClient.setQueryData(CACHED_ACCOUNTS_KEY, [
      makeAccount(),
    ]);

    result.current.hook.mutate("123456");

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(
      result.current.queryClient.getQueryData(CACHED_ACCOUNTS_KEY),
    ).toBeUndefined();
    expect(result.current.queryClient.getQueryData(["session"])).toEqual(user);
  });
});
