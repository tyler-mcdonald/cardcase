import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "@/routes/AccountsPage";
import { listAccounts } from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import { ApiError } from "@/lib/api/errors";
import { makeAccount } from "../features/accounts/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
}));

const mockedListAccounts = vi.mocked(listAccounts);

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

function renderPage(route = "/") {
  return renderWithProviders(<AccountsPage />, { route });
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
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

  it("falls back to the first page when the requested page doesn't exist", async () => {
    mockedListAccounts
      .mockRejectedValueOnce(new ApiError("Not found", 404))
      .mockResolvedValueOnce(page([makeAccount({ name: "Starbucks" })]));

    renderPage("/?page=9");

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenNthCalledWith(1, 9);
    expect(mockedListAccounts).toHaveBeenLastCalledWith(1);
    expect(screen.queryByText("Couldn't load your accounts")).toBeNull();
  });
});
