import { screen } from "@testing-library/react";
import { beforeEach, describe, it, vi } from "vitest";
import App from "@/App";
import { mockSignedInUser } from "./auth";
import { renderWithProviders } from "./render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/auth/UserMenu", () => ({
  UserMenu: () => <div>User menu</div>,
}));

beforeEach(() => {
  mockSignedInUser();
});

describe("App", () => {
  it("routes /settings to the settings page", () => {
    renderWithProviders(<App />, { route: "/settings" });

    screen.getByRole("heading", { level: 1, name: "Settings" });
  });
});
