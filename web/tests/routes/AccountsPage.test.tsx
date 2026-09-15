import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "@/routes/AccountsPage";
import { listAccounts } from "@/features/accounts/api";
import { useAuth } from "@/lib/use-auth";
import { makeAccount } from "../features/accounts/factories";

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockedListAccounts = vi.mocked(listAccounts);
const mockedUseAuth = vi.mocked(useAuth);

function renderPage() {
  return render(
    <MantineProvider>
      <AccountsPage />
    </MantineProvider>,
  );
}

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    status: "authenticated",
    user: { id: "1", email: "test@example.com" },
    requestLoginCode: vi.fn(),
    confirmLoginCode: vi.fn(),
    logout: vi.fn(),
  });
});

describe("AccountsPage", () => {
  it("shows the user's accounts once loaded", async () => {
    mockedListAccounts.mockResolvedValueOnce([
      makeAccount({ name: "Starbucks" }),
      makeAccount({
        id: "2",
        name: "Delta SkyMiles Credit",
        type: "flight_credit",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.getByText("Delta SkyMiles Credit")).toBeTruthy();
  });

  it("shows an empty message when there are no accounts", async () => {
    mockedListAccounts.mockResolvedValueOnce([]);

    renderPage();

    expect(await screen.findByText("No accounts yet.")).toBeTruthy();
  });

  it("shows an error state and can retry", async () => {
    mockedListAccounts.mockRejectedValueOnce(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Couldn't load your accounts")).toBeTruthy();

    mockedListAccounts.mockResolvedValueOnce([makeAccount({ name: "Amazon" })]);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Amazon")).toBeTruthy();
  });

  it("shows the signed-in user's email", async () => {
    mockedListAccounts.mockResolvedValueOnce([]);

    renderPage();

    expect(screen.getByText("test@example.com").textContent).toBe(
      "test@example.com",
    );
  });
});
