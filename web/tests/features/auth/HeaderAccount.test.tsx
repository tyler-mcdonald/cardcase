import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderAccount } from "@/features/auth/HeaderAccount";
import { useLogout } from "@/features/auth/queries";
import { mockSignedInUser, TEST_USER } from "@tests/features/auth/fixtures";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/auth/use-auth");
vi.mock("@/features/auth/queries");

beforeEach(() => {
  mockSignedInUser();
  vi.mocked(useLogout).mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useLogout>);
});

describe("HeaderAccount", () => {
  it("shows the email next to the account menu", () => {
    renderWithProviders(<HeaderAccount />);

    screen.getByText(TEST_USER.email);
    screen.getByRole("button", { name: "Account menu" });
  });

  it("shows the email for a demo user", () => {
    mockSignedInUser({ id: "2", email: "demo-2@demo.invalid", is_demo: true });

    renderWithProviders(<HeaderAccount />);

    screen.getByText("demo-2@demo.invalid");
    expect(screen.queryByText("Demo")).toBeNull();
  });
});
