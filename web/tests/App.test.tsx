import { screen } from "@testing-library/react";
import { beforeEach, describe, it, vi } from "vitest";
import App from "@/App";
import { useAuth } from "@/features/auth/use-auth";
import { renderWithProviders } from "./render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/auth/UserMenu", () => ({
  UserMenu: () => <div>User menu</div>,
}));

const mockedUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com" },
  });
});

describe("App", () => {
  it("routes /settings to the settings page", () => {
    renderWithProviders(<App />, { route: "/settings" });

    screen.getByRole("heading", { level: 1, name: "Settings" });
  });
});
