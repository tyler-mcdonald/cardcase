import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountCard } from "@/features/accounts/AccountCard";
import type { Account } from "@/features/accounts/api";

function renderCard(account: Account) {
  return render(
    <MantineProvider>
      <AccountCard account={account} />
    </MantineProvider>,
  );
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "1",
    name: "Amazon",
    description: "",
    type: "gift_card",
    expires_on: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
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

    expect(screen.getByText("Starbucks").textContent).toBe("Starbucks");
    expect(screen.getByText("Gift card").textContent).toBe("Gift card");
  });

  it("shows the flight credit label", () => {
    renderCard(makeAccount({ type: "flight_credit" }));

    expect(screen.getByText("Flight credit").textContent).toBe("Flight credit");
  });

  it("shows an expired badge for a past expiration date", () => {
    renderCard(makeAccount({ expires_on: "2026-01-01" }));

    expect(screen.getByText("Expired Jan 1, 2026").textContent).toBe(
      "Expired Jan 1, 2026",
    );
  });

  it("shows an upcoming expiration date without the expired label", () => {
    renderCard(makeAccount({ expires_on: "2027-01-01" }));

    expect(screen.getByText("Expires Jan 1, 2027").textContent).toBe(
      "Expires Jan 1, 2027",
    );
  });

  it("reserves space for the balance with a placeholder", () => {
    renderCard(makeAccount());

    const balance = screen.getByText("—");
    expect(balance.getAttribute("aria-label")).toBe(
      "Balance tracking isn't available yet",
    );
  });
});
