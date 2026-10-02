import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsPage } from "@/routes/TransactionsPage";
import { listTransactions } from "@/features/transactions/api";
import { ApiError } from "@/lib/api/errors";
import { makeTransaction } from "../features/transactions/factories";
import { makePage } from "../lib/api/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/transactions/api", () => ({
  listTransactions: vi.fn(),
}));

const mockedListTransactions = vi.mocked(listTransactions);

function renderPage(route = "/") {
  return renderWithProviders(<TransactionsPage />, { route });
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("TransactionsPage", () => {
  it("shows each transaction's date, account, description, and amount", async () => {
    mockedListTransactions.mockResolvedValueOnce(
      makePage([
        makeTransaction({
          id: "1",
          account: { id: "a", name: "Starbucks", type: "gift_card" },
          amount: "-4.75",
          description: "Latte",
          occurred_on: "2026-09-28",
        }),
        makeTransaction({
          id: "2",
          account: { id: "b", name: "Delta", type: "flight_credit" },
          amount: "150.00",
          description: "Refund",
          occurred_on: "2026-09-27",
        }),
      ]),
    );

    renderPage();

    const latteRow = (await screen.findByText("Latte")).closest("tr")!;
    const refundRow = screen.getByText("Refund").closest("tr")!;
    const cells = (row: HTMLElement) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);

    expect(cells(latteRow)).toEqual([
      "Sep 28, 2026",
      "StarbucksGift card",
      "Latte",
      "$4.75",
      "",
    ]);
    expect(cells(refundRow)).toEqual([
      "Sep 27, 2026",
      "DeltaFlight credit",
      "Refund",
      "",
      "$150.00",
    ]);
    expect(mockedListTransactions).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: "2" })).toBeNull();
  });

  it("shows an empty message when there are no transactions", async () => {
    mockedListTransactions.mockResolvedValueOnce(makePage([]));

    renderPage();

    expect(await screen.findByText("No transactions yet.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows an error state and can retry", async () => {
    mockedListTransactions.mockRejectedValueOnce(new Error("network down"));

    renderPage();

    expect(
      await screen.findByText("Couldn't load your transactions"),
    ).toBeTruthy();

    mockedListTransactions.mockResolvedValueOnce(
      makePage([makeTransaction({ description: "Groceries" })]),
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Groceries")).toBeTruthy();
  });

  it("loads the page named in the URL", async () => {
    mockedListTransactions.mockResolvedValueOnce(
      makePage([makeTransaction({ description: "Groceries" })]),
    );

    renderPage("/?page=3");

    expect(await screen.findByText("Groceries")).toBeTruthy();
    expect(mockedListTransactions).toHaveBeenCalledWith(3);
  });

  it("paginates through the transactions", async () => {
    mockedListTransactions
      .mockResolvedValueOnce(
        makePage([makeTransaction({ description: "Groceries" })], {
          count: 3,
          hasNext: true,
        }),
      )
      .mockResolvedValueOnce(
        makePage([makeTransaction({ id: "2", description: "Movies" })], {
          count: 3,
        }),
      );

    renderPage();

    expect(await screen.findByText("Groceries")).toBeTruthy();
    expect(screen.getByRole("button", { name: "3" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(await screen.findByText("Movies")).toBeTruthy();
    expect(mockedListTransactions).toHaveBeenLastCalledWith(2);
  });

  it("falls back to the first page when the requested page doesn't exist", async () => {
    mockedListTransactions
      .mockRejectedValueOnce(new ApiError("Not found", 404))
      .mockResolvedValueOnce(
        makePage([makeTransaction({ description: "Groceries" })]),
      );

    renderPage("/?page=9");

    expect(await screen.findByText("Groceries")).toBeTruthy();
    expect(mockedListTransactions).toHaveBeenNthCalledWith(1, 9);
    expect(mockedListTransactions).toHaveBeenLastCalledWith(1);
    expect(screen.queryByText("Couldn't load your transactions")).toBeNull();
  });
});
