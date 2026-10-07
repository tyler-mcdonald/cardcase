import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountCard } from "@/features/accounts/AccountCard";
import type { Account } from "@/features/accounts/types";
import { makeAccount } from "./factories";
import { renderWithProviders } from "../../render";

function renderCard(account: Account) {
  const onEdit = vi.fn();
  renderWithProviders(<AccountCard account={account} onEdit={onEdit} />);
  return { onEdit };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AccountCard", () => {
  it("opens the account for editing when clicked", () => {
    const { onEdit } = renderCard(makeAccount({ name: "Starbucks" }));

    fireEvent.click(screen.getByRole("button", { name: "Edit Starbucks" }));

    expect(onEdit).toHaveBeenCalled();
  });

  it("renders the account name and type", () => {
    renderCard(makeAccount({ name: "Starbucks", type: "gift_card" }));

    screen.getByText("Starbucks");
    screen.getByText("Gift card");
  });

  it("shows the flight credit label", () => {
    renderCard(makeAccount({ type: "flight_credit" }));

    screen.getByText("Flight credit");
  });

  it("shows an expired badge for a past expiration date", () => {
    renderCard(makeAccount({ expires_on: "2026-01-01" }));

    screen.getByText("Expired Jan 1, 2026");
  });

  it("shows an upcoming expiration date without the expired label", () => {
    renderCard(makeAccount({ expires_on: "2027-01-01" }));

    screen.getByText("Expires Jan 1, 2027");
  });

  it("shows the balance formatted as dollars", () => {
    renderCard(makeAccount({ balance: "1234.5" }));

    screen.getByText("$1,234.50");
  });

  it("shows a zero balance as $0.00", () => {
    renderCard(makeAccount({ balance: "0.00" }));

    screen.getByText("$0.00");
  });

  it("shows a negative balance with a minus sign", () => {
    renderCard(makeAccount({ balance: "-12.34" }));

    screen.getByText("-$12.34");
  });

  it("shows a negative balance in red", () => {
    renderCard(makeAccount({ balance: "-12.34" }));

    expect(screen.getByText("-$12.34").style.color).toBe(
      "var(--mantine-color-red-4)",
    );
  });

  it("shows a positive balance in white", () => {
    renderCard(makeAccount({ balance: "12.34" }));

    expect(screen.getByText("$12.34").style.color).toBe(
      "var(--mantine-color-white)",
    );
  });
});
