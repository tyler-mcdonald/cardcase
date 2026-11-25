import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileHeaderAccount } from "@/features/auth/MobileHeaderAccount";
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

describe("MobileHeaderAccount", () => {
  it("shows the email only inside the account menu", () => {
    renderWithProviders(<MobileHeaderAccount />);

    expect(screen.queryByText(TEST_USER.email)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    screen.getByText(TEST_USER.email);
  });
});
