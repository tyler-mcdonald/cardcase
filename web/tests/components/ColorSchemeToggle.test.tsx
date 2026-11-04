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

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

describe("ColorSchemeToggle", () => {
  it("switches between light and dark", () => {
    renderWithProviders(<ColorSchemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(
      document.documentElement.getAttribute("data-mantine-color-scheme"),
    ).toBe("dark");

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(
      document.documentElement.getAttribute("data-mantine-color-scheme"),
    ).toBe("light");
  });

  it("follows a dark OS setting on its first render", () => {
    mockOsDark();

    expect(renderFirstPass()).toContain('aria-label="Switch to light mode"');
  });

  it("uses a saved preference over the OS setting", () => {
    mockOsDark();
    window.localStorage.setItem("mantine-color-scheme-value", "light");

    expect(renderFirstPass()).toContain('aria-label="Switch to dark mode"');
  });
});
