import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "@/AppLayout";
import { useLogout } from "@/features/auth/queries";
import { mockSignedInUser } from "./features/auth/fixtures";
import { renderWithProviders } from "./render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/queries", () => ({
  useLogout: vi.fn(),
}));
vi.mock("@/features/auth/DemoWelcomeModal", () => ({
  DemoWelcomeModal: () => null,
}));

const mockedUseLogout = vi.mocked(useLogout);

beforeEach(() => {
  mockSignedInUser();
  mockedUseLogout.mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useLogout>);
});

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<div>Home content</div>} />
        <Route path="other" element={<div>Other content</div>} />
        <Route path="transactions" element={<div>Transactions content</div>} />
        <Route path="settings" element={<div>Settings content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

describe("AppLayout", () => {
  it("renders the header around the current page", () => {
    renderLayout("/other");

    screen.getByRole("button", { name: "Account menu" });
    screen.getByText("Other content");
  });

  it("shows the email and avatar menu in the header's account area", () => {
    renderLayout("/other");

    screen.getByText("test@example.com");
    expect(screen.queryByRole("button", { name: "Color scheme" })).toBeNull();
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });

  it("links the brand back home", () => {
    renderLayout("/other");

    fireEvent.click(screen.getByRole("link", { name: "cardcase" }));

    screen.getByText("Home content");
  });

  it("navigates between accounts and transactions", () => {
    renderLayout("/other");

    fireEvent.click(screen.getByRole("link", { name: "Transactions" }));
    screen.getByText("Transactions content");

    fireEvent.click(screen.getByRole("link", { name: "Accounts" }));
    screen.getByText("Home content");
  });

  it("opens settings from the avatar menu", () => {
    renderLayout("/other");
    openAccountMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));

    screen.getByText("Settings content");
  });
});
