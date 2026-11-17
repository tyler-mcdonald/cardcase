import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MOBILE_MEDIA_QUERY, useIsMobile } from "@/lib/hooks/use-is-mobile";
import { mockMobileViewport } from "@tests/viewport";

function renderFirstValue() {
  const values: boolean[] = [];
  renderHook(() => {
    values.push(useIsMobile());
  });
  return values[0];
}

describe("MOBILE_MEDIA_QUERY", () => {
  it("matches the max-width query Mantine emits below the sm breakpoint", () => {
    expect(MOBILE_MEDIA_QUERY).toBe("(max-width: 47.99375em)");
  });
});

describe("useIsMobile", () => {
  it("is false at the default desktop viewport", () => {
    expect(renderFirstValue()).toBe(false);
  });

  it("is true on the first render at a mobile viewport", () => {
    mockMobileViewport();

    expect(renderFirstValue()).toBe(true);
  });
});
