import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/features/auth/UserMenu";
import { useLogout } from "@/features/auth/queries";
import { mockSignedInUser, TEST_USER } from "@tests/features/auth/fixtures";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/auth/use-auth");
vi.mock("@/features/auth/queries");

const mockedUseLogout = vi.mocked(useLogout);
const logout = vi.fn();

beforeEach(() => {
  mockSignedInUser();
  mockedUseLogout.mockReturnValue({
    mutate: logout,
  } as unknown as ReturnType<typeof useLogout>);
});

describe("UserMenu", () => {
  it("shows the signed-in user's email", () => {
    renderWithProviders(<UserMenu />);

    screen.getByText(TEST_USER.email);
  });

  it("shows a demo badge instead of the email for a demo user", async () => {
    mockSignedInUser({ id: "2", email: "demo-2@demo.invalid", is_demo: true });

    renderWithProviders(<UserMenu />);

    expect(screen.queryByText("demo-2@demo.invalid")).toBeNull();
    fireEvent.focus(screen.getByText("Demo"));
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Demo data is temporary",
    );
  });

  it("logs out when the button is clicked", () => {
    renderWithProviders(<UserMenu />);

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalled();
  });
});
