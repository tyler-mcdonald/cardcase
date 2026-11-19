import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "@/App";
import { useAuth } from "@/features/auth/use-auth";
import { GENERIC_ERROR } from "@/lib/api/errors";
import { mockSignedInUser } from "@tests/features/auth/fixtures";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/auth/LoginForm", () => ({
  LoginForm: () => <div>Login form</div>,
}));

vi.mock("@/features/auth/HeaderAccount", () => ({
  HeaderAccount: () => <div>Header account</div>,
}));

beforeEach(() => {
  mockSignedInUser();
});

it("routes /settings to the settings page", () => {
  renderWithProviders(<App />, { route: "/settings" });

  screen.getByRole("heading", { level: 1, name: "Settings" });
});

it("redirects /settings to the login page when signed out", () => {
  vi.mocked(useAuth).mockReturnValue({ user: null, sessionError: null });

  renderWithProviders(<App />, { route: "/settings" });

  screen.getByText("Login form");
  expect(screen.queryByRole("heading", { name: "Settings" })).toBeNull();
});

it("shows the header and a loader while the session is loading", () => {
  vi.mocked(useAuth).mockReturnValue({ user: undefined, sessionError: null });

  renderWithProviders(<App />, { route: "/settings" });

  screen.getByText("Header account");
  screen.getByLabelText("Checking your sign-in");
  expect(screen.queryByRole("heading", { name: "Settings" })).toBeNull();
});

it("shows a retryable error in the layout instead of signing out when the session check fails", () => {
  const retry = vi.fn();
  vi.mocked(useAuth).mockReturnValue({
    user: undefined,
    sessionError: { error: new Error("network down"), retrying: false, retry },
  });

  renderWithProviders(<App />, { route: "/settings" });

  screen.getByText("Header account");
  expect(screen.queryByText("Login form")).toBeNull();
  screen.getByText(GENERIC_ERROR);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
