import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/features/auth/UserMenu";
import { useLogout } from "@/features/auth/queries";
import { mockSignedInUser, TEST_USER } from "./fixtures";
import { renderWithProviders } from "../../render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/queries", () => ({
  useLogout: vi.fn(),
}));

const mockedUseLogout = vi.mocked(useLogout);
const logout = vi.fn();
const originalMatchMedia = window.matchMedia;

function mockOsDark() {
  window.matchMedia = vi.fn((query: string) => ({
    ...originalMatchMedia(query),
    matches: query === "(prefers-color-scheme: dark)",
  }));
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

function chooseTheme(name: string) {
  openMenu();
  fireEvent.click(screen.getByRole("menuitemradio", { name }));
}

function appliedScheme() {
  return document.documentElement.getAttribute("data-mantine-color-scheme");
}

function checkedItems() {
  return screen
    .getAllByRole("menuitemradio", { checked: true })
    .map((item) => item.textContent);
}

function uncheckedItems() {
  return screen
    .getAllByRole("menuitemradio", { checked: false })
    .map((item) => item.textContent);
}

beforeEach(() => {
  mockSignedInUser();
  mockedUseLogout.mockReturnValue({
    mutate: logout,
  } as unknown as ReturnType<typeof useLogout>);
});

afterEach(() => {
  logout.mockReset();
  window.matchMedia = originalMatchMedia;
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

describe("UserMenu", () => {
  it("shows the email's first letter, uppercased, as the avatar", () => {
    renderWithProviders(<UserMenu />);

    expect(
      screen.getByRole("button", { name: "Account menu" }).textContent,
    ).toBe("T");
  });

  it("shows the email next to the avatar in the header", () => {
    renderWithProviders(<UserMenu />);

    screen.getByText("test@example.com");
  });

  it("lists the email, Settings, the theme options and Sign out in order", () => {
    renderWithProviders(<UserMenu />);
    openMenu();

    const menu = screen.getByRole("menu");
    const entries = Array.from(
      menu.querySelectorAll(
        '.mantine-Menu-label, [role="menuitem"], [role="menuitemradio"]',
      ),
    ).map((entry) => entry.textContent);
    expect(entries).toEqual([
      TEST_USER.email,
      "Settings",
      "Theme",
      "Light",
      "Dark",
      "System",
      "Sign out",
    ]);
  });

  it("wraps a long email instead of overflowing the menu", () => {
    renderWithProviders(<UserMenu />);
    openMenu();

    expect(
      within(screen.getByRole("menu")).getByText("test@example.com").style
        .overflowWrap,
    ).toBe("anywhere");
  });

  it("links Settings to the settings page", () => {
    renderWithProviders(<UserMenu />);
    openMenu();

    expect(
      screen.getByRole("menuitem", { name: "Settings" }).getAttribute("href"),
    ).toBe("/settings");
  });

  it("signs out when Sign out is clicked", () => {
    renderWithProviders(<UserMenu />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(logout).toHaveBeenCalled();
  });

  it("switches to dark", () => {
    renderWithProviders(<UserMenu />);

    chooseTheme("Dark");

    expect(appliedScheme()).toBe("dark");
    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "dark",
    );
  });

  it("switches to light", () => {
    window.localStorage.setItem("mantine-color-scheme-value", "dark");
    renderWithProviders(<UserMenu />);

    chooseTheme("Light");

    expect(appliedScheme()).toBe("light");
    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "light",
    );
  });

  it("switches to system and follows the OS", () => {
    mockOsDark();
    window.localStorage.setItem("mantine-color-scheme-value", "light");
    renderWithProviders(<UserMenu />);

    chooseTheme("System");

    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "auto",
    );
    expect(appliedScheme()).toBe("dark");
  });

  it("marks only the saved theme as checked", () => {
    renderWithProviders(<UserMenu />);

    chooseTheme("Dark");
    openMenu();
    expect(checkedItems()).toEqual(["Dark"]);
    expect(uncheckedItems()).toEqual(["Light", "System"]);
    expect(
      screen
        .getByRole("menuitemradio", { name: "Dark" })
        .querySelector('[data-icon="check"]'),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "System" }));
    openMenu();
    expect(checkedItems()).toEqual(["System"]);
    expect(uncheckedItems()).toEqual(["Light", "Dark"]);
  });
});
