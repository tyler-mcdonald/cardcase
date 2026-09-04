import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeHtml } from "@/lib/SafeHtml";

describe("SafeHtml", () => {
  it("renders safe markup as-is", () => {
    const { container } = render(
      <SafeHtml html="<p>hello <strong>world</strong></p>" />,
    );
    expect(container.innerHTML).toBe(
      "<div><p>hello <strong>world</strong></p></div>",
    );
  });

  it("strips script tags", () => {
    const { container } = render(
      <SafeHtml html="<img src=x><script>alert(1)</script>" />,
    );
    expect(container.querySelector("script")).toBeNull();
  });

  it("strips inline event handler attributes", () => {
    const { container } = render(
      <SafeHtml html={'<img src=x onerror="alert(1)">'} />,
    );
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
  });
});
