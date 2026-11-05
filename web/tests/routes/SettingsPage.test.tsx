import { screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SettingsPage } from "@/routes/SettingsPage";
import { mockSignedInUser, TEST_USER } from "@tests/features/auth/fixtures";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  mockSignedInUser();
});

it("renders the settings heading", () => {
  renderWithProviders(<SettingsPage />);

  screen.getByRole("heading", { name: "Settings" });
});

it("shows the signed-in user's email read-only in the account section", () => {
  renderWithProviders(<SettingsPage />);

  screen.getByRole("heading", { name: "Account" });
  const email = screen.getByLabelText<HTMLInputElement>("Email");
  expect(email.value).toBe(TEST_USER.email);
  expect(email.readOnly).toBe(true);
});
