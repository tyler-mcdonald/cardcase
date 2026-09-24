import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountCard } from "@/features/accounts/AccountCard";
import type { Account } from "@/features/accounts/api";
import { makeAccount } from "./factories";
import { renderWithProviders } from "../../render";

function renderCard(account: Account) {
  return renderWithProviders(<AccountCard account={account} />);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AccountCard", () => {
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

  it("reserves space for the balance with a placeholder", () => {
    renderCard(makeAccount());

    const balance = screen.getByText("—");
    expect(balance.getAttribute("aria-label")).toBe(
      "Balance tracking isn't available yet",
    );
  });
});
