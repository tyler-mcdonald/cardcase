import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pager } from "@/components/Pager";
import { renderWithProviders } from "@tests/render";
import { mockMobileViewport } from "@tests/viewport";

function pageNumbers() {
  return screen
    .getAllByRole("button")
    .map((button) => button.textContent)
    .filter((text) => text && /^\d+$/.test(text));
}

describe("Pager", () => {
  it("shows the current page's neighbours on desktop", () => {
    renderWithProviders(<Pager total={10} page={5} onChange={() => {}} />);

    expect(pageNumbers()).toEqual(["1", "4", "5", "6", "10"]);
  });

  it("shows only the first, current and last page on mobile", () => {
    mockMobileViewport();

    renderWithProviders(<Pager total={10} page={5} onChange={() => {}} />);

    expect(pageNumbers()).toEqual(["1", "5", "10"]);
  });
});
