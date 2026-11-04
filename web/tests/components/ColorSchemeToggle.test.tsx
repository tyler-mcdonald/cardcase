import { MantineProvider } from "@mantine/core";
import { fireEvent, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { renderWithProviders } from "../render";

const originalMatchMedia = window.matchMedia;

function mockOsDark() {
  window.matchMedia = vi.fn((query: string) => ({
    ...originalMatchMedia(query),
    matches: query === "(prefers-color-scheme: dark)",
  }));
}

function renderFirstPass() {
  return renderToStaticMarkup(
    <MantineProvider env="test" defaultColorScheme="auto">
      <ColorSchemeToggle />
    </MantineProvider>,
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Color scheme" }));
}

function choose(name: string) {
  openMenu();
  fireEvent.click(screen.getByRole("menuitem", { name }));
}

function appliedScheme() {
  return document.documentElement.getAttribute("data-mantine-color-scheme");
}

function triggerIcon() {
  return screen
    .getByRole("button", { name: "Color scheme" })
    .querySelector("[data-icon]")
    ?.getAttribute("data-icon");
}

function checkedItem() {
  return screen
    .getAllByRole("menuitem")
    .filter((item) => item.querySelector('[data-icon="check"]'))
    .map((item) => item.textContent);
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

describe("ColorSchemeToggle", () => {
  it("lists Light, Dark and System under a Theme label", () => {
    renderWithProviders(<ColorSchemeToggle />);
    openMenu();

    screen.getByText("Theme");
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Light", "Dark", "System"]);
  });

  it("switches to dark", () => {
    renderWithProviders(<ColorSchemeToggle />);

    choose("Dark");

    expect(appliedScheme()).toBe("dark");
    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "dark",
    );
    expect(triggerIcon()).toBe("moon");
  });

  it("switches to light", () => {
    window.localStorage.setItem("mantine-color-scheme-value", "dark");
    renderWithProviders(<ColorSchemeToggle />);

    choose("Light");

    expect(appliedScheme()).toBe("light");
    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "light",
    );
    expect(triggerIcon()).toBe("sun");
  });

  it("switches to system and follows the OS", () => {
    mockOsDark();
    window.localStorage.setItem("mantine-color-scheme-value", "light");
    renderWithProviders(<ColorSchemeToggle />);

    choose("System");

    expect(window.localStorage.getItem("mantine-color-scheme-value")).toBe(
      "auto",
    );
    expect(appliedScheme()).toBe("dark");
    expect(triggerIcon()).toBe("moon");
  });

  it("marks only the saved choice with a check", () => {
    renderWithProviders(<ColorSchemeToggle />);

    choose("Dark");
    openMenu();
    expect(checkedItem()).toEqual(["Dark"]);

    fireEvent.click(screen.getByRole("menuitem", { name: "System" }));
    openMenu();
    expect(checkedItem()).toEqual(["System"]);
  });

  it("follows a dark OS setting on its first render", () => {
    mockOsDark();

    expect(renderFirstPass()).toContain('data-icon="moon"');
  });

  it("uses a saved preference over the OS setting", () => {
    mockOsDark();
    window.localStorage.setItem("mantine-color-scheme-value", "light");

    expect(renderFirstPass()).toContain('data-icon="sun"');
  });
});
