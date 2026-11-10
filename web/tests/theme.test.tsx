import {
  Button,
  type ButtonProps,
  DEFAULT_THEME,
  mergeMantineTheme,
  Pagination,
} from "@mantine/core";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cssVariablesResolver, theme } from "@/theme";
import classes from "@/theme.module.css";
import { renderWithProviders } from "./render";

function renderButton(props: ButtonProps) {
  renderWithProviders(<Button {...props}>Save</Button>);
  return screen.getByRole("button", { name: "Save" });
}

describe("theme", () => {
  it("gives default buttons the accent look", () => {
    const button = renderButton({});
    expect(button.style.getPropertyValue("--button-bg")).toBe(
      "var(--accent-bg)",
    );
    expect(button.style.getPropertyValue("--button-hover")).toBe(
      "var(--accent-hover)",
    );
    expect(button.style.getPropertyValue("--button-color")).toBe(
      "var(--accent-color)",
    );
    expect(button.style.getPropertyValue("--button-bd")).toBe(
      "1px solid var(--accent-rim)",
    );
  });

  it("keeps an explicit color on buttons", () => {
    const button = renderButton({ color: "red" });
    expect(button.style.getPropertyValue("--button-bg")).toBe(
      "var(--mantine-color-red-filled)",
    );
  });

  it("keeps an explicit variant on buttons", () => {
    const button = renderButton({ variant: "subtle" });
    expect(button.style.getPropertyValue("--button-bg")).not.toContain(
      "--accent",
    );
  });

  it("gives the active pagination page the accent look", () => {
    const { container } = renderWithProviders(<Pagination total={3} />);
    const root = container.querySelector<HTMLElement>(
      ".mantine-Pagination-root",
    );
    expect(root?.style.getPropertyValue("--pagination-active-bg")).toBe(
      "var(--accent-bg)",
    );
    expect(root?.style.getPropertyValue("--pagination-active-color")).toBe(
      "var(--accent-color)",
    );
    const active = screen.getByRole("button", { name: "1" });
    expect(active.hasAttribute("data-active")).toBe(true);
    expect(classes.paginationControl).toBeTruthy();
    expect(active.classList.contains(classes.paginationControl)).toBe(true);
  });

  it("resolves indigo accent variables per color scheme", () => {
    const { light, dark } = cssVariablesResolver(
      mergeMantineTheme(DEFAULT_THEME, theme),
    );

    expect(light).toEqual({
      "--accent-bg": "var(--mantine-color-indigo-light)",
      "--accent-hover": "var(--mantine-color-indigo-light-hover)",
      "--accent-color": "var(--mantine-color-indigo-light-color)",
      "--accent-rim": "transparent",
    });
    expect(dark).toEqual({
      "--accent-bg": "rgba(92, 124, 250, 0.15)",
      "--accent-hover": "rgba(92, 124, 250, 0.22)",
      "--accent-color": "#91a7ff",
      "--accent-rim": "rgba(145, 167, 255, 0.35)",
    });
  });
});
