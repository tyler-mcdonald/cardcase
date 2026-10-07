import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsPage } from "@/routes/TransactionsPage";
import { listAllAccounts } from "@/features/accounts/api";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "@/features/transactions/api";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { makeAccount } from "../features/accounts/factories";
import { makeTransaction } from "../features/transactions/factories";
import { makePage } from "../lib/api/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/transactions/api", () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock("@/features/accounts/api", () => ({
  listAllAccounts: vi.fn(),
}));

const mockedListTransactions = vi.mocked(listTransactions);
const mockedCreateTransaction = vi.mocked(createTransaction);
const mockedUpdateTransaction = vi.mocked(updateTransaction);
const mockedDeleteTransaction = vi.mocked(deleteTransaction);
const mockedListAllAccounts = vi.mocked(listAllAccounts);

function renderPage(route = "/") {
  return renderWithProviders(<TransactionsPage />, { route });
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

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

it("disables adding a transaction until the list has loaded", async () => {
  mockedListTransactions.mockReturnValueOnce(new Promise(() => {}));
  renderPage();

  expect(
    screen
      .getByRole("button", { name: "Add transaction" })
      .hasAttribute("disabled"),
  ).toBe(true);
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
        makeAccount({ id: "starbucks-id", name: "Starbucks" }),
        makeAccount({ id: "delta-id", name: "Delta" }),
      ]),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function openNewTransactionForm() {
    renderPage();
    await screen.findByText("Groceries");
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));
  }

  async function chooseAccount(name: string) {
    fireEvent.click(screen.getByRole("combobox", { name: "Account" }));
    fireEvent.click(await screen.findByRole("option", { name }));
  }

  function enterOutflow(amount: string) {
    fireEvent.change(screen.getByRole("textbox", { name: "Outflow" }), {
      target: { value: amount },
    });
  }

  it("saves an outflow as a negative amount", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    enterOutflow("4.75");
    save();

    await waitFor(() =>
      expect(mockedCreateTransaction).toHaveBeenCalledWith("starbucks-id", {
        amount: "-4.75",
        description: "",
        occurred_on: "2026-09-30",
      }),
    );
  });

  it("trims the description", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "  Latte  " },
    });
    enterOutflow("4.75");
    save();

    await waitFor(() =>
      expect(mockedCreateTransaction).toHaveBeenCalledWith(
        "starbucks-id",
        expect.objectContaining({ description: "Latte" }),
      ),
    );
  });

  it("closes and refreshes the list after saving", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    enterOutflow("4.75");
    mockedListTransactions.mockResolvedValueOnce(
      makePage([makeTransaction({ id: "2", description: "Latte" })]),
    );
    save();

    expect(await screen.findByText("Latte")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("saves an inflow as a positive amount", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransactionForm();

    await chooseAccount("Delta");
    fireEvent.change(screen.getByRole("textbox", { name: "Inflow" }), {
      target: { value: "150" },
    });
    save();

    await waitFor(() =>
      expect(mockedCreateTransaction).toHaveBeenCalledWith("delta-id", {
        amount: "150.00",
        description: "",
        occurred_on: "2026-09-30",
      }),
    );
  });

  it("saves when Enter is pressed", async () => {
    mockedCreateTransaction.mockResolvedValueOnce(makeTransaction());
    await openNewTransactionForm();

    await chooseAccount("Delta");
    const inflow = screen.getByRole("textbox", { name: "Inflow" });
    fireEvent.change(inflow, { target: { value: "150" } });
    fireEvent.keyDown(inflow, { key: "Enter" });

    await waitFor(() => expect(mockedCreateTransaction).toHaveBeenCalled());
  });

  it("clears the other amount when one is entered", async () => {
    await openNewTransactionForm();

    const outflow = screen.getByRole("textbox", { name: "Outflow" });
    const inflow = screen.getByRole("textbox", { name: "Inflow" });
    fireEvent.change(outflow, { target: { value: "10" } });
    fireEvent.change(inflow, { target: { value: "20" } });

    expect((outflow as HTMLInputElement).value).toBe("");
    expect((inflow as HTMLInputElement).value).toBe("20");
  });

  it("formats an amount when it loses focus", async () => {
    await openNewTransactionForm();

    const outflow = screen.getByRole("textbox", { name: "Outflow" });
    fireEvent.change(outflow, { target: { value: "4.5" } });
    expect((outflow as HTMLInputElement).value).toBe("4.5");
    fireEvent.blur(outflow);

    expect((outflow as HTMLInputElement).value).toBe("4.50");
  });

  it("opens the account dropdown when tabbed into and closes it when tabbing away", async () => {
    await openNewTransactionForm();

    const account = screen.getByRole("combobox", { name: "Account" });
    act(() => account.focus());
    fireEvent.keyUp(account, { key: "Tab" });
    await screen.findByRole("option", { name: "Starbucks" });
    fireEvent.blur(account);

    await waitFor(() =>
      expect(screen.queryByRole("option", { name: "Starbucks" })).toBeNull(),
    );
  });

  it("requires an account", async () => {
    await openNewTransactionForm();

    enterOutflow("5");
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Account is required",
    );
    expect(
      screen
        .getByRole("combobox", { name: "Account" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("requires a date", async () => {
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    enterOutflow("5");
    const date = screen.getByRole("textbox", { name: "Date" });
    fireEvent.change(date, { target: { value: "" } });
    fireEvent.blur(date);
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Date is required",
    );
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("requires an outflow or an inflow", async () => {
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Enter either an outflow or an inflow",
    );
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("shows an error and stays open when saving fails", async () => {
    mockedCreateTransaction.mockRejectedValueOnce(
      new ApiError("Request failed (500)", 500),
    );
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    enterOutflow("5");
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("focuses the date when opened", async () => {
    await openNewTransactionForm();

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Date" }),
    );
  });

  it("discards unsaved changes when opened again", async () => {
    await openNewTransactionForm();

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Latte" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(
      (screen.getByRole("textbox", { name: "Description" }) as HTMLInputElement)
        .value,
    ).toBe("");
  });

  it("can't be reopened while a save is pending", async () => {
    mockedCreateTransaction.mockReturnValueOnce(new Promise(() => {}));
    await openNewTransactionForm();

    await chooseAccount("Starbucks");
    enterOutflow("5");
    save();

    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Add transaction" })
          .hasAttribute("disabled"),
      ).toBe(true),
    );
  });

  it("closes without saving on cancel", async () => {
    await openNewTransactionForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("textbox", { name: "Description" })).toBeNull();
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("closes without saving when clicking outside", async () => {
    await openNewTransactionForm();

    fireEvent.click(screen.getByRole("combobox", { name: "Account" }));
    const option = await screen.findByRole("option", { name: "Starbucks" });
    fireEvent.mouseDown(option);
    fireEvent.click(option);
    expect(screen.getByRole("textbox", { name: "Description" })).toBeTruthy();

    fireEvent.click(screen.getByRole("heading", { name: "Transactions" }));

    expect(screen.queryByRole("textbox", { name: "Description" })).toBeNull();
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("closes without saving when Escape is pressed", async () => {
    await openNewTransactionForm();

    const description = screen.getByRole("textbox", { name: "Description" });
    act(() => description.focus());
    fireEvent.keyDown(description, { key: "Escape" });

    expect(screen.queryByRole("textbox", { name: "Description" })).toBeNull();
    expect(mockedCreateTransaction).not.toHaveBeenCalled();
  });

  it("only closes the account dropdown when Escape is pressed in it", async () => {
    await openNewTransactionForm();

    const account = screen.getByRole("combobox", { name: "Account" });
    fireEvent.click(account);
    await screen.findByRole("option", { name: "Starbucks" });
    fireEvent.keyDown(account, { key: "Escape" });

    expect(screen.getByRole("textbox", { name: "Description" })).toBeTruthy();
  });

  it("only closes the calendar when Escape is pressed in the date", async () => {
    await openNewTransactionForm();

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Date" }), {
      key: "Escape",
    });

    expect(screen.getByRole("textbox", { name: "Description" })).toBeTruthy();
  });

  it("opens in place of the empty state", async () => {
    mockedListTransactions.mockResolvedValueOnce(makePage([]));
    renderPage();
    await screen.findByText("No transactions yet.");

    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(screen.queryByText("No transactions yet.")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Description" })).toBeTruthy();
  });
});

describe("editing a transaction", () => {
  const latte = makeTransaction({
    id: "latte-id",
    account: { id: "starbucks-id", name: "Starbucks", type: "gift_card" },
    amount: "-4.75",
    description: "Latte",
    occurred_on: "2026-09-28",
  });
  const refund = makeTransaction({
    id: "refund-id",
    account: { id: "delta-id", name: "Delta", type: "flight_credit" },
    amount: "150.00",
    description: "Refund",
    occurred_on: "2026-09-27",
  });

  beforeEach(() => {
    mockedListTransactions.mockResolvedValue(makePage([latte, refund]));
    mockedListAllAccounts.mockResolvedValue(makePage([]));
  });

  async function openEditor(description: string) {
    renderPage();
    fireEvent.click(await screen.findByText(description));
  }

  function inputValue(name: string) {
    return (screen.getByRole("textbox", { name }) as HTMLInputElement).value;
  }

  it("prefills an outflow with the transaction's values", async () => {
    await openEditor(latte.description);

    expect(inputValue("Date")).toBe("Sep 28, 2026");
    expect(inputValue("Description")).toBe(latte.description);
    expect(inputValue("Outflow")).toBe("4.75");
    expect(inputValue("Inflow")).toBe("");
  });

  it("prefills an inflow under Inflow", async () => {
    await openEditor(refund.description);

    expect(inputValue("Outflow")).toBe("");
    expect(inputValue("Inflow")).toBe("150.00");
  });

  it("focuses the field that was clicked", async () => {
    renderPage();

    fireEvent.click(await screen.findByText("$150.00"));

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Inflow" }),
    );
  });

  it("focuses the date when the account was clicked", async () => {
    renderPage();

    fireEvent.click(await screen.findByText(latte.account.name));

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Date" }),
    );
  });

  it("disables Save while saving", async () => {
    mockedUpdateTransaction.mockReturnValueOnce(new Promise(() => {}));
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    save();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save" }).hasAttribute("disabled"),
      ).toBe(true),
    );
  });

  it("closes without saving when clicking outside", async () => {
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    fireEvent.click(screen.getByRole("heading", { name: "Transactions" }));

    expect(screen.queryByRole("textbox", { name: "Description" })).toBeNull();
    expect(mockedUpdateTransaction).not.toHaveBeenCalled();
  });

  it("shows the account but doesn't allow changing it", async () => {
    await openEditor(latte.description);

    const account = screen.getByRole("textbox", { name: "Account" });
    expect((account as HTMLInputElement).value).toBe(latte.account.name);
    expect(account.hasAttribute("disabled")).toBe(true);
  });

  it("sends only the changed fields", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    save();

    await waitFor(() =>
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        latte.account.id,
        latte.id,
        { description: "Mocha" },
      ),
    );
  });

  it("moves an amount from Outflow to Inflow", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Inflow" }), {
      target: { value: "4.75" },
    });
    save();

    await waitFor(() =>
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        latte.account.id,
        latte.id,
        { amount: "4.75" },
      ),
    );
  });

  it("closes without a request when nothing changed", async () => {
    await openEditor(latte.description);

    save();

    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(mockedUpdateTransaction).not.toHaveBeenCalled();
  });

  it("saves when Enter is pressed", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    await openEditor(latte.description);

    const description = screen.getByRole("textbox", { name: "Description" });
    fireEvent.change(description, { target: { value: "Mocha" } });
    fireEvent.keyDown(description, { key: "Enter" });

    await waitFor(() => expect(mockedUpdateTransaction).toHaveBeenCalled());
  });

  it("closes and shows the updated row after saving", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    mockedListTransactions.mockResolvedValue(
      makePage([{ ...latte, description: "Mocha" }, refund]),
    );
    save();

    expect(await screen.findByText("Mocha")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("stays on the current page after saving", async () => {
    mockedListTransactions.mockResolvedValue(
      makePage([latte], { count: 2, hasNext: true }),
    );
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    renderPage("/?page=2");
    fireEvent.click(await screen.findByText(latte.description));

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    save();

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull(),
    );
    expect(mockedListTransactions).toHaveBeenLastCalledWith(2);
  });

  it("doesn't reopen the editor after leaving its page", async () => {
    const coffee = makeTransaction({ id: "coffee-id", description: "Coffee" });
    mockedListTransactions.mockImplementation(async (page) =>
      page === 1
        ? makePage([latte, refund], { count: 3, hasNext: true })
        : makePage([coffee], { count: 3 }),
    );
    await openEditor(latte.description);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(await screen.findByText(coffee.description)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "1" }));

    expect(await screen.findByText(latte.description)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("sends only the fields changed since the editor opened", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    await openEditor(latte.description);
    mockedListTransactions.mockResolvedValue(
      makePage([
        { ...latte, description: "Renamed elsewhere" },
        { ...refund, description: "Partial refund" },
      ]),
    );

    try {
      act(() => {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
      });
      expect(await screen.findByText("Partial refund")).toBeTruthy();
    } finally {
      focusManager.setFocused(undefined);
    }
    fireEvent.change(screen.getByRole("textbox", { name: "Outflow" }), {
      target: { value: "5.00" },
    });
    save();

    await waitFor(() =>
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        latte.account.id,
        latte.id,
        { amount: "-5.00" },
      ),
    );
  });

  it("refreshes the accounts after saving", async () => {
    mockedUpdateTransaction.mockResolvedValueOnce(latte);
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    save();

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["accounts"] }),
    );
  });

  it("requires a date", async () => {
    await openEditor(latte.description);

    const date = screen.getByRole("textbox", { name: "Date" });
    fireEvent.change(date, { target: { value: "" } });
    fireEvent.blur(date);
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Date is required",
    );
    expect(mockedUpdateTransaction).not.toHaveBeenCalled();
  });

  it("requires an outflow or an inflow", async () => {
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Outflow" }), {
      target: { value: "" },
    });
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Enter either an outflow or an inflow",
    );
    expect(mockedUpdateTransaction).not.toHaveBeenCalled();
  });

  it("shows an error and stays open when saving fails", async () => {
    mockedUpdateTransaction.mockRejectedValueOnce(
      new ApiError("Request failed (500)", 500),
    );
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    save();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("discards unsaved changes when another row is clicked", async () => {
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    fireEvent.click(screen.getByText(refund.description));

    expect(inputValue("Description")).toBe(refund.description);
    expect(screen.getByText(latte.description)).toBeTruthy();
    expect(mockedUpdateTransaction).not.toHaveBeenCalled();
  });

  it("discards unsaved changes when adding a transaction", async () => {
    await openEditor(latte.description);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Mocha" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(inputValue("Description")).toBe("");
    expect(screen.getByText(latte.description)).toBeTruthy();
    expect(
      screen.getAllByRole("textbox", { name: "Description" }),
    ).toHaveLength(1);
  });
});

describe("deleting a transaction", () => {
  const latte = makeTransaction({
    id: "latte-id",
    account: { id: "starbucks-id", name: "Starbucks", type: "gift_card" },
    description: "Latte",
  });
  const refund = makeTransaction({ id: "refund-id", description: "Refund" });

  beforeEach(() => {
    mockedListTransactions.mockResolvedValue(makePage([latte, refund]));
  });

  async function startDelete(route = "/") {
    renderPage(route);
    fireEvent.click(await screen.findByText(latte.description));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    return screen.findByRole("dialog", { name: "Delete this transaction?" });
  }

  function confirmDelete(dialog: HTMLElement) {
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
  }

  it("isn't offered when adding a transaction", async () => {
    mockedListAllAccounts.mockResolvedValue(makePage([]));
    renderPage();
    await screen.findByText(latte.description);

    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("asks for confirmation before deleting", async () => {
    const dialog = await startDelete();

    expect(within(dialog).getByText("This can't be undone.")).toBeTruthy();
    expect(mockedDeleteTransaction).not.toHaveBeenCalled();
  });

  it("deletes the transaction and removes it from the table", async () => {
    mockedDeleteTransaction.mockResolvedValueOnce(undefined);
    const dialog = await startDelete();

    mockedListTransactions.mockResolvedValue(makePage([refund]));
    confirmDelete(dialog);

    await waitFor(() =>
      expect(screen.queryByText(latte.description)).toBeNull(),
    );
    expect(mockedDeleteTransaction).toHaveBeenCalledWith(
      latte.account.id,
      latte.id,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByText(refund.description)).toBeTruthy();
  });

  it("refreshes the accounts after deleting", async () => {
    mockedDeleteTransaction.mockResolvedValueOnce(undefined);
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    const dialog = await startDelete();

    confirmDelete(dialog);

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["accounts"] }),
    );
  });

  it("returns to the editor when deleting is cancelled", async () => {
    const dialog = await startDelete();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(mockedDeleteTransaction).not.toHaveBeenCalled();
  });

  it("returns to the first page after deleting the last transaction on a page", async () => {
    mockedListTransactions.mockImplementation(async (page) => {
      if (page === 1) {
        return makePage([refund], { count: 2, hasNext: true });
      }
      if (mockedDeleteTransaction.mock.calls.length > 0) {
        throw new ApiError("Not found", 404);
      }
      return makePage([latte], { count: 2 });
    });
    mockedDeleteTransaction.mockResolvedValueOnce(undefined);
    const dialog = await startDelete("/?page=2");

    confirmDelete(dialog);

    expect(await screen.findByText(refund.description)).toBeTruthy();
    expect(screen.queryByText(latte.description)).toBeNull();
    expect(mockedListTransactions).toHaveBeenLastCalledWith(1);
  });

  it("treats a transaction that's already gone as deleted", async () => {
    mockedDeleteTransaction.mockRejectedValueOnce(
      new ApiError("Not found", 404, { detail: "Not found." }),
    );
    const dialog = await startDelete();

    mockedListTransactions.mockResolvedValue(makePage([refund]));
    confirmDelete(dialog);

    await waitFor(() =>
      expect(screen.queryByText(latte.description)).toBeNull(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows an error in the dialog when deleting fails", async () => {
    mockedDeleteTransaction.mockRejectedValueOnce(
      new ApiError("Server error", 500),
    );
    const dialog = await startDelete();

    confirmDelete(dialog);

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      GENERIC_ERROR,
    );
    expect(dialog.isConnected).toBe(true);
  });
});
