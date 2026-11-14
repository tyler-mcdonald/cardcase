import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrandLogo } from "@/features/brands/BrandLogo";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/brands/brandfetch-url", async (importOriginal) => ({
  ...(await importOriginal()),
  brandLogoUrl: (domain: string) => `https://logos.test/${domain}`,
}));

describe("BrandLogo", () => {
  it("renders a decorative lazy-loaded logo for the domain", () => {
    const { container } = renderWithProviders(
      <BrandLogo domain="amazon.com" size={28} />,
    );

    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://logos.test/amazon.com");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("marks the logo as loaded once it loads", () => {
    const { container } = renderWithProviders(
      <BrandLogo domain="amazon.com" size={28} />,
    );

    const img = container.querySelector("img")!;
    expect(img.hasAttribute("data-loaded")).toBe(false);

    fireEvent.load(img);

    expect(img.hasAttribute("data-loaded")).toBe(true);
  });

  it("shows an empty placeholder when the logo fails to load", () => {
    const { container } = renderWithProviders(
      <BrandLogo domain="amazon.com" size={28} />,
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("brand-logo-placeholder").textContent).toBe("");
  });

  it("shows the given fallback when the logo fails to load", () => {
    const { container } = renderWithProviders(
      <BrandLogo domain="amazon.com" size={28} fallback="🎁" />,
    );

    fireEvent.error(container.querySelector("img")!);

    screen.getByText("🎁");
  });

  it("retries the logo when the domain changes after an error", () => {
    const { container, rerender } = renderWithProviders(
      <BrandLogo domain="amazon.com" size={28} fallback="🎁" />,
    );
    fireEvent.error(container.querySelector("img")!);

    rerender(<BrandLogo domain="delta.com" size={28} fallback="🎁" />);

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://logos.test/delta.com",
    );
  });
});
