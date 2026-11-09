import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useLogout } from "@/features/auth/queries";
import { SettingsPage } from "@/routes/SettingsPage";
import { mockSignedInUser, TEST_USER } from "../features/auth/fixtures";
import { renderWithProviders } from "../render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/queries");

const DEMO_USER = { id: "2", email: "demo-2@demo.invalid", is_demo: true };
const logout = vi.fn();

beforeEach(() => {
  logout.mockReset();
  vi.mocked(useLogout).mockReturnValue({
    mutate: logout,
    isPending: false,
  } as unknown as ReturnType<typeof useLogout>);
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

it("hides the email from a demo user", () => {
  mockSignedInUser(DEMO_USER);
  renderWithProviders(<SettingsPage />);

  screen.getByRole("heading", { name: "Account" });
  screen.getByText(/temporary demo account/);
  expect(screen.queryByLabelText("Email")).toBeNull();
  expect(screen.queryByText(DEMO_USER.email)).toBeNull();
});

it("signs a demo user out so they can sign up", () => {
  mockSignedInUser(DEMO_USER);
  renderWithProviders(<SettingsPage />);

  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

  expect(logout).toHaveBeenCalledOnce();
});
