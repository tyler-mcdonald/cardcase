import type { ReactNode } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "@/AppLayout";
import { useLogout } from "@/features/auth/queries";
import { DesktopHeader } from "@/layout/DesktopHeader";
import { MobileHeader } from "@/layout/MobileHeader";
import { MobileTabBar } from "@/layout/MobileTabBar";
import { mockSignedInUser } from "@tests/features/auth/fixtures";
import { renderWithProviders } from "@tests/render";

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

function renderAround(layout: ReactNode, route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={layout}>
        <Route index element={<div>Home content</div>} />
        <Route path="other" element={<div>Other content</div>} />
        <Route path="transactions" element={<div>Transactions content</div>} />
        <Route path="settings" element={<div>Settings content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

function renderWith(chrome: ReactNode, route: string) {
  return renderAround(
    <>
      {chrome}
      <Outlet />
    </>,
    route,
  );
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

describe("AppLayout", () => {
  it("renders the current page with the mobile and desktop chrome", () => {
    renderAround(<AppLayout />, "/other");

    screen.getByText("Other content");
    screen.getByRole("navigation", { name: "Primary" });
    screen.getByText("test@example.com");
  });
});

describe("DesktopHeader", () => {
  it("shows the email and avatar menu in the account area", () => {
    renderWith(<DesktopHeader />, "/other");

    screen.getByText("test@example.com");
    screen.getByRole("button", { name: "Account menu" });
    expect(screen.queryByRole("button", { name: "Color scheme" })).toBeNull();
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });

  it("links the brand back home", () => {
    renderWith(<DesktopHeader />, "/other");

    fireEvent.click(screen.getByRole("link", { name: "cardcase" }));

    screen.getByText("Home content");
  });

  it("navigates between accounts and transactions", () => {
    renderWith(<DesktopHeader />, "/other");

    fireEvent.click(screen.getByRole("link", { name: "Transactions" }));
    screen.getByText("Transactions content");

    fireEvent.click(screen.getByRole("link", { name: "Accounts" }));
    screen.getByText("Home content");
  });

  it("opens settings from the avatar menu", () => {
    renderWith(<DesktopHeader />, "/other");
    openAccountMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));

    screen.getByText("Settings content");
  });
});

describe("MobileHeader", () => {
  it("shows only the brand and avatar menu", () => {
    renderWith(<MobileHeader />, "/other");

    screen.getByRole("link", { name: "cardcase" });
    screen.getByRole("button", { name: "Account menu" });
    expect(screen.queryByText("test@example.com")).toBeNull();
  });
});

describe("MobileTabBar", () => {
  it("navigates between accounts and transactions", () => {
    renderWith(<MobileTabBar />, "/other");

    fireEvent.click(screen.getByRole("link", { name: "Transactions" }));
    screen.getByText("Transactions content");

    fireEvent.click(screen.getByRole("link", { name: "Accounts" }));
    screen.getByText("Home content");
  });

  it("highlights the current page's tab", () => {
    renderWith(<MobileTabBar />, "/transactions");

    const current = (name: string) =>
      screen.getByRole("link", { name }).getAttribute("aria-current");

    expect(current("Transactions")).toBe("page");
    expect(current("Accounts")).toBeNull();
  });
});
