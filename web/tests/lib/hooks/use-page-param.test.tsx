import { fireEvent, screen } from "@testing-library/react";
import { Navigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { usePageParam } from "@/lib/hooks/use-page-param";
import { LocationDisplay } from "../../LocationDisplay";
import { renderWithProviders } from "../../render";

function Pager() {
  const { page, goToPage } = usePageParam();
  return (
    <>
      <p>Page {page}</p>
      <button onClick={() => goToPage(1)}>First</button>
      <button onClick={() => goToPage(page + 1)}>Next</button>
      <LocationDisplay />
    </>
  );
}

function MissingPageRedirect() {
  const { page, searchWithoutPage } = usePageParam();
  if (page > 1) {
    return <Navigate to={{ search: searchWithoutPage }} replace />;
  }
  return <LocationDisplay />;
}

describe("usePageParam", () => {
  it("keeps other params when going to page 1", () => {
    renderWithProviders(<Pager />, { route: "/?account=x&page=3" });

    fireEvent.click(screen.getByRole("button", { name: "First" }));

    expect(screen.getByTestId("location").textContent).toBe("?account=x");
  });

  it("keeps other params when going to a later page", () => {
    renderWithProviders(<Pager />, { route: "/?account=x&page=3" });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("location").textContent).toBe(
      "?account=x&page=4",
    );
  });

  it("keeps other params on the missing-page redirect", () => {
    renderWithProviders(<MissingPageRedirect />, {
      route: "/?account=x&page=3",
    });

    expect(screen.getByTestId("location").textContent).toBe("?account=x");
  });
});
