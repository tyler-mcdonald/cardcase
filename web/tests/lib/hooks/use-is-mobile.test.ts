import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { mockMobileViewport } from "@tests/viewport";

function renderFirstValue() {
  const values: boolean[] = [];
  renderHook(() => {
    values.push(useIsMobile());
  });
  return values[0];
}

describe("useIsMobile", () => {
  it("is false at the default desktop viewport", () => {
    expect(renderFirstValue()).toBe(false);
  });

  it("is true on the first render at a mobile viewport", () => {
    mockMobileViewport();

    expect(renderFirstValue()).toBe(true);
  });
});
