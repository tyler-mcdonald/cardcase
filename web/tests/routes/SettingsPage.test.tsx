import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/use-auth";
import { SettingsPage } from "@/routes/SettingsPage";
import { renderWithProviders } from "../render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com" },
  });
});

describe("SettingsPage", () => {
  it("renders the settings heading", () => {
    renderWithProviders(<SettingsPage />);

    screen.getByRole("heading", { name: "Settings" });
  });

  it("shows the signed-in user's email read-only in the account section", () => {
    renderWithProviders(<SettingsPage />);

    screen.getByRole("heading", { name: "Account" });
    const email = screen.getByLabelText<HTMLInputElement>("Email");
    expect(email.value).toBe("test@example.com");
    expect(email.readOnly).toBe(true);
  });
});
