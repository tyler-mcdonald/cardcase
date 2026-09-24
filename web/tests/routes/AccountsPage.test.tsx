import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "@/routes/AccountsPage";
import { listAccounts, type Account } from "@/features/accounts/api";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import { makeAccount } from "../features/accounts/factories";

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
}));
vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/queries", () => ({
  useLogout: vi.fn(),
}));

const mockedListAccounts = vi.mocked(listAccounts);
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseLogout = vi.mocked(useLogout);

function page(
  results: Account[],
  { count = results.length, hasNext = false } = {},
) {
  return {
    count,
    next: hasNext ? "http://localhost:8000/v1/accounts?page=next" : null,
    previous: null,
    results,
  };
}

function renderPage(initialEntry = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AccountsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com" },
  });
  mockedUseLogout.mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useLogout>);
});

describe("AccountsPage", () => {
  it("shows the user's accounts once loaded", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([
        makeAccount({ name: "Starbucks" }),
        makeAccount({
          id: "2",
          name: "Delta SkyMiles Credit",
          type: "flight_credit",
        }),
      ]),
    );

    renderPage();

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.getByText("Delta SkyMiles Credit")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: "2" })).toBeNull();
  });

  it("shows an empty message when there are no accounts", async () => {
    mockedListAccounts.mockResolvedValueOnce(page([]));

    renderPage();

    expect(await screen.findByText("No accounts yet.")).toBeTruthy();
  });

  it("shows an error state and can retry", async () => {
    mockedListAccounts.mockRejectedValueOnce(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Couldn't load your accounts")).toBeTruthy();

    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ name: "Amazon" })]),
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Amazon")).toBeTruthy();
  });

  it("loads the page named in the URL", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ name: "Target" })]),
    );

    renderPage("/?page=3");

    expect(await screen.findByText("Target")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenCalledWith(3);
  });

  it("paginates through the accounts", async () => {
    mockedListAccounts
      .mockResolvedValueOnce(
        page([makeAccount({ name: "Starbucks" })], { count: 3, hasNext: true }),
      )
      .mockResolvedValueOnce(
        page([makeAccount({ id: "2", name: "Amazon" })], { count: 3 }),
      );

    renderPage();

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.getByRole("button", { name: "3" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(await screen.findByText("Amazon")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenLastCalledWith(2);
  });

  it("shows the signed-in user's email", async () => {
    mockedListAccounts.mockResolvedValueOnce(page([]));

    renderPage();

    screen.getByText("test@example.com");
  });
});
