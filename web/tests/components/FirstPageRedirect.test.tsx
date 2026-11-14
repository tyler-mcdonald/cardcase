import { screen } from "@testing-library/react";
import { useSearchParams } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FirstPageRedirect } from "@/components/FirstPageRedirect";
import { LocationDisplay } from "@tests/LocationDisplay";
import { renderWithProviders } from "@tests/render";

function RedirectFromLaterPage() {
  const [searchParams] = useSearchParams();
  return searchParams.has("page") ? <FirstPageRedirect /> : <LocationDisplay />;
}

describe("FirstPageRedirect", () => {
  it("keeps other params when redirecting to page 1", () => {
    renderWithProviders(<RedirectFromLaterPage />, {
      route: "/?account=x&page=3",
    });

    expect(screen.getByTestId("location").textContent).toBe("?account=x");
  });
});
