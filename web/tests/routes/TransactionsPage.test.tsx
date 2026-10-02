import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsPage } from "@/routes/TransactionsPage";
import { listAllAccounts } from "@/features/accounts/api";
import {
  createTransaction,
  listTransactions,
} from "@/features/transactions/api";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { makeAccount } from "../features/accounts/factories";
import { makeTransaction } from "../features/transactions/factories";
import { makePage } from "../lib/api/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/transactions/api", () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
}));

vi.mock("@/features/accounts/api", () => ({
  listAllAccounts: vi.fn(),
}));

const mockedListTransactions = vi.mocked(listTransactions);
const mockedCreateTransaction = vi.mocked(createTransaction);
const mockedListAllAccounts = vi.mocked(listAllAccounts);

function renderPage(route = "/") {
  return renderWithProviders(<TransactionsPage />, { route });
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});

it("shows each transaction's date, account, type, description, and amount", async () => {
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
    "Starbucks",
    "Gift card",
    "Latte",
    "$4.75",
    "",
  ]);
  expect(cells(refundRow)).toEqual([
    "Sep 27, 2026",
    "Delta",
    "Flight credit",
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

describe("adding a transaction", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    mockedListTransactions.mockResolvedValue(
      makePage([makeTransaction({ description: "Groceries" })]),
    );
    mockedListAllAccounts.mockResolvedValue(
      makePage([
        makeAccount({ id: "a", name: "Starbucks" }),
        makeAccount({ id: "b", name: "Delta" }),
      ]),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function openNewTransaction() {
    renderPage();
    await screen.findByText("Groceries");
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));
  }

  async function chooseAccount(name: string) {
    fireEvent.click(screen.getByRole("combobox", { name: "Account" }));
    fireEvent.click(await screen.findByRole("option", { name }));
  }

  it("saves an outflow as a negative amount and refreshes the list", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransaction();

    await chooseAccount("Starbucks");
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "  Latte  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Outflow" }), {
      target: { value: "4.75" },
    });
    mockedListTransactions.mockResolvedValueOnce(
      makePage([makeTransaction({ id: "2", description: "Latte" })]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Latte")).toBeTruthy();
    expect(mockedCreateTransaction).toHaveBeenCalledWith("a", {
      amount: "-4.75",
      description: "Latte",
      occurred_on: "2026-09-30",
    });
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("saves an inflow as a positive amount when Enter is pressed", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransaction();

    await chooseAccount("Delta");
    const inflow = screen.getByRole("textbox", { name: "Inflow" });
    fireEvent.change(inflow, { target: { value: "150" } });
    fireEvent.keyDown(inflow, { key: "Enter" });

    await waitFor(() =>
      expect(mockedCreateTransaction).toHaveBeenCalledWith("b", {
        amount: "150.00",
        description: "",
        occurred_on: "2026-09-30",
      }),
    );
  });

  it("picks the first matching account when Enter is pressed after searching", async () => {
    await openNewTransaction();

    const account = screen.getByRole("combobox", { name: "Account" });
    account.focus();
    fireEvent.click(account);
    await screen.findByRole("option", { name: "Delta" });
    fireEvent.change(account, { target: { value: "Star" } });
    fireEvent.keyDown(account, { key: "Enter", code: "Enter" });

    expect((account as HTMLInputElement).value).toBe("Starbucks");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the other amount when one is entered", async () => {
    await openNewTransaction();

    const outflow = screen.getByRole("textbox", { name: "Outflow" });
    const inflow = screen.getByRole("textbox", { name: "Inflow" });
    fireEvent.change(outflow, { target: { value: "10" } });
    fireEvent.change(inflow, { target: { value: "20" } });

    expect((outflow as HTMLInputElement).value).toBe("");
    expect((inflow as HTMLInputElement).value).toBe("20");
  });

  it("rejects a missing account, date, and amount", async () => {
    await openNewTransaction();

    const date = screen.getByRole("textbox", { name: "Date" });
    fireEvent.change(date, { target: { value: "" } });
    fireEvent.blur(date);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Account is required")).toBeTruthy();
    expect(within(alert).getByText("Date is required")).toBeTruthy();
    expect(
      within(alert).getByText("Enter either an outflow or an inflow"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("combobox", { name: "Account" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("shows an error and stays open when saving fails", async () => {
    mockedCreateTransaction.mockRejectedValueOnce(
      new ApiError("Request failed (500)", 500),
    );
    await openNewTransaction();

    await chooseAccount("Starbucks");
    fireEvent.change(screen.getByRole("textbox", { name: "Outflow" }), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("discards unsaved changes when opened again", async () => {
    await openNewTransaction();

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Latte" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(
      (screen.getByRole("textbox", { name: "Description" }) as HTMLInputElement)
        .value,
    ).toBe("");
  });

  it("closes without saving on cancel", async () => {
    await openNewTransaction();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("textbox", { name: "Description" })).toBeNull();
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("opens in place of the empty state", async () => {
    mockedListTransactions.mockReset();
    mockedListTransactions.mockResolvedValueOnce(makePage([]));
    renderPage();
    await screen.findByText("No transactions yet.");

    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(screen.queryByText("No transactions yet.")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Description" })).toBeTruthy();
  });
});
