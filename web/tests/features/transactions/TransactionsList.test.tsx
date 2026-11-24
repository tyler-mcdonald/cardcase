import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  TransactionsList,
  TransactionsListSkeleton,
} from "@/features/transactions/TransactionsList";
import type { Transaction } from "@/features/transactions/types";
import { makeTransaction } from "@tests/features/transactions/factories";
import { renderWithProviders } from "@tests/render";

function renderList(transactions: Transaction[]) {
  const onSelect = vi.fn();
  renderWithProviders(
    <TransactionsList
      transactions={transactions}
      accountLabel={(account) => ({ name: account.name })}
      onSelect={onSelect}
    />,
  );
  return { onSelect };
}

describe("TransactionsList", () => {
  it("shows the description, then the account and date", () => {
    renderList([
      makeTransaction({ description: "Headphones", occurred_on: "2026-11-10" }),
    ]);

    const row = screen.getByRole("button");
    within(row).getByText("Headphones");
    within(row).getByText("Amazon · Nov 10, 2026");
  });

  it("shows the account, then the date, when there's no description", () => {
    renderList([
      makeTransaction({ description: "", occurred_on: "2026-11-10" }),
    ]);

    const row = screen.getByRole("button");
    within(row).getByText("Amazon");
    within(row).getByText("Nov 10, 2026");
  });

  it("shows an outflow with a minus sign", () => {
    renderList([makeTransaction({ amount: "-24.99" })]);

    const amount = screen.getByText("-$24.99");
    expect(amount.style.color).toBe("");
  });

  it("shows an inflow with a plus sign in green", () => {
    renderList([makeTransaction({ amount: "310.00" })]);

    expect(screen.getByText("+$310.00").style.color).toBe(
      "var(--mantine-color-green-text)",
    );
  });

  it("selects the transaction when its row is tapped", () => {
    const transaction = makeTransaction();
    const { onSelect } = renderList([transaction]);

    fireEvent.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledWith(transaction);
  });

  it("renders one row per transaction", () => {
    renderList([makeTransaction({ id: "1" }), makeTransaction({ id: "2" })]);

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});

describe("TransactionsListSkeleton", () => {
  it("renders placeholder rows shaped like the list", () => {
    renderWithProviders(<TransactionsListSkeleton />);

    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
