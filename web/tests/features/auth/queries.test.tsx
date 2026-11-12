import { renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  sessionQuery,
  useConfirmLoginCode,
  useDeleteUserAccount,
  useLogout,
} from "@/features/auth/queries";
import { allAccountsQuery } from "@/features/accounts/queries";
import { confirmLoginCode, deleteMe, logout } from "@/features/auth/api";
import { announceUserChange } from "@/features/auth/session-channel";
import { makeAccount } from "@tests/features/accounts/factories";
import { TestProviders } from "@tests/TestProviders";
import { sessionResponse, TEST_USER } from "@tests/features/auth/fixtures";

vi.mock("@/features/auth/api");
vi.mock("@/features/auth/session-channel");

const mockedConfirmLoginCode = vi.mocked(confirmLoginCode);
const mockedLogout = vi.mocked(logout);
const mockedDeleteMe = vi.mocked(deleteMe);

const CACHED_ACCOUNTS_KEY = allAccountsQuery().queryKey;
const SESSION_KEY = sessionQuery().queryKey;

function renderWithQueryClient<T>(useHook: () => T) {
  return renderHook(
    () => ({ hook: useHook(), queryClient: useQueryClient() }),
    { wrapper: TestProviders },
  );
}

function mockLogoutSuccess() {
  mockedLogout.mockResolvedValueOnce(sessionResponse(null));
}

describe("auth queries", () => {
  it("clears cached accounts when logout succeeds", async () => {
    mockLogoutSuccess();
    const { result } = renderWithQueryClient(useLogout);
    result.current.queryClient.setQueryData(CACHED_ACCOUNTS_KEY, [
      makeAccount(),
    ]);

    result.current.hook.mutate();

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(
      result.current.queryClient.getQueryData(CACHED_ACCOUNTS_KEY),
    ).toBeUndefined();
  });

  it("clears other session-prefixed queries and cached mutations on logout", async () => {
    mockLogoutSuccess();
    const { result } = renderWithQueryClient(useLogout);
    const queryClient = result.current.queryClient;
    queryClient.setQueryData(["session", "extra"], "previous user");
    queryClient.getMutationCache().build(queryClient, {
      mutationFn: async () => "previous user",
    });

    result.current.hook.mutate();

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(queryClient.getQueryData(["session", "extra"])).toBeUndefined();
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("clears cached accounts when login confirm succeeds", async () => {
    const user = { id: "2", email: "b@example.com", is_demo: false };
    mockedConfirmLoginCode.mockResolvedValueOnce(sessionResponse(user));
    const { result } = renderWithQueryClient(useConfirmLoginCode);
    result.current.queryClient.setQueryData(CACHED_ACCOUNTS_KEY, [
      makeAccount(),
    ]);

    result.current.hook.mutate("123456");

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(
      result.current.queryClient.getQueryData(CACHED_ACCOUNTS_KEY),
    ).toBeUndefined();
    expect(result.current.queryClient.getQueryData(SESSION_KEY)).toEqual(user);
  });

  it("signs out locally and clears cached data when account deletion succeeds", async () => {
    mockedDeleteMe.mockResolvedValueOnce(null);
    const { result } = renderWithQueryClient(useDeleteUserAccount);
    const queryClient = result.current.queryClient;
    queryClient.setQueryData(SESSION_KEY, TEST_USER);
    queryClient.setQueryData(CACHED_ACCOUNTS_KEY, [makeAccount()]);

    result.current.hook.mutate();

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(queryClient.getQueryData(SESSION_KEY)).toBeNull();
    expect(queryClient.getQueryData(CACHED_ACCOUNTS_KEY)).toBeUndefined();
    expect(announceUserChange).toHaveBeenCalledTimes(1);
  });

  it("announces a user change when the session user changes", async () => {
    mockLogoutSuccess();
    const { result } = renderWithQueryClient(useLogout);
    result.current.queryClient.setQueryData(SESSION_KEY, TEST_USER);

    result.current.hook.mutate();

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(announceUserChange).toHaveBeenCalledTimes(1);
  });

  it("does not announce a user change when the session user stays the same", async () => {
    const user = { id: "2", email: "b@example.com", is_demo: false };
    mockedConfirmLoginCode.mockResolvedValueOnce(sessionResponse(user));
    const { result } = renderWithQueryClient(useConfirmLoginCode);
    result.current.queryClient.setQueryData(SESSION_KEY, user);

    result.current.hook.mutate("123456");

    await waitFor(() => expect(result.current.hook.isSuccess).toBe(true));
    expect(announceUserChange).not.toHaveBeenCalled();
  });
});
