import { screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "@/App";
import { useAuth } from "@/features/auth/use-auth";
import { mockSignedInUser } from "./features/auth/fixtures";
import { renderWithProviders } from "./render";

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
  vi.mocked(useAuth).mockReturnValue({ user: null });

  renderWithProviders(<App />, { route: "/settings" });

  screen.getByText("Login form");
  expect(screen.queryByRole("heading", { name: "Settings" })).toBeNull();
});
