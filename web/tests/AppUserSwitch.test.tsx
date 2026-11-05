import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "@/App";
import { AuthProvider } from "@/features/auth/AuthProvider";
import {
  confirmLoginCode,
  getSession,
  logout,
  requestLoginCode,
} from "@/features/auth/api";
import { listAccounts } from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import type { Paginated } from "@/lib/api/types";
import { makeAccount } from "./features/accounts/factories";
import { makePage } from "./lib/api/factories";
import { renderWithProviders } from "./render";

vi.mock("@/features/auth/api");
vi.mock("@/features/accounts/api");

const mockedGetSession = vi.mocked(getSession);
const mockedRequestLoginCode = vi.mocked(requestLoginCode);
const mockedConfirmLoginCode = vi.mocked(confirmLoginCode);
const mockedLogout = vi.mocked(logout);
const mockedListAccounts = vi.mocked(listAccounts);

const USER_A = { id: "1", email: "a@example.com", is_demo: false };
const USER_B = { id: "2", email: "b@example.com", is_demo: false };

async function signInAs(email: string) {
  fireEvent.change(await screen.findByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  const [firstCodeInput] = await screen.findAllByLabelText("Code");
  fireEvent.change(firstCodeInput, { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("App user switch", () => {
  it("never shows the previous user's accounts after switching users", async () => {
    mockedGetSession.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: USER_A },
    });
    mockedListAccounts.mockResolvedValueOnce(
      makePage([makeAccount({ id: "a1", name: "User A gift card" })]),
    );
    mockedLogout.mockResolvedValueOnce({
      status: 401,
      meta: { is_authenticated: false },
    });
    mockedRequestLoginCode.mockResolvedValueOnce({
      status: 401,
      meta: { is_authenticated: false },
    });
    mockedConfirmLoginCode.mockResolvedValueOnce({
      status: 200,
      meta: { is_authenticated: true },
      data: { user: USER_B },
    });
    let resolveUserBAccounts: (page: Paginated<Account>) => void = () => {};
    mockedListAccounts.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUserBAccounts = resolve;
      }),
    );

    renderWithProviders(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    await screen.findByText("User A gift card");
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    await signInAs(USER_B.email);

    await screen.findByText(USER_B.email);
    expect(screen.queryByText("User A gift card")).toBeNull();

    resolveUserBAccounts(
      makePage([makeAccount({ id: "b1", name: "User B gift card" })]),
    );

    await screen.findByText("User B gift card");
    await waitFor(() =>
      expect(screen.queryByText("User A gift card")).toBeNull(),
    );
  });
});
