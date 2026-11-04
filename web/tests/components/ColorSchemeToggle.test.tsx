import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { renderWithProviders } from "../render";

afterEach(() => {
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
});
