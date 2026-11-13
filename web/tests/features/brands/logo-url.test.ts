import { afterEach, describe, expect, it, vi } from "vitest";
import { brandLogoUrl } from "@/features/brands/logo-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("brandLogoUrl", () => {
  it("builds the logo CDN URL with the client ID", () => {
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "client-123");

    expect(brandLogoUrl("starbucks.com")).toBe(
      "https://cdn.brandfetch.io/domain/starbucks.com/w/64/h/64/fallback/404?c=client-123",
    );
  });

  it("reads the client ID when called", () => {
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "first");
    brandLogoUrl("delta.com");
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "second");

    expect(brandLogoUrl("delta.com")).toContain("?c=second");
  });
});
