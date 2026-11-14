import { screen, waitFor } from "@testing-library/react";
import { queryOptions } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { usePaginatedQuery } from "@/lib/hooks/use-paginated-query";
import { LocationDisplay } from "@tests/LocationDisplay";
import { renderWithProviders } from "@tests/render";

function itemsQuery(page: number) {
  return queryOptions({
    queryKey: ["items", page],
    queryFn: async () => {
      if (page > 1) {
        throw new ApiError("Not found", 404);
      }
      return ["item"];
    },
    retry: false,
  });
}

function List() {
  const { query, page } = usePaginatedQuery(itemsQuery);
  return (
    <>
      <p>Page {page}</p>
      {query.data && <p>Loaded</p>}
      <LocationDisplay />
    </>
  );
}

describe("usePaginatedQuery", () => {
  it("returns to page 1, keeping other params, when the page is past the last", async () => {
    renderWithProviders(<List />, { route: "/?account=x&page=3" });

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("?account=x"),
    );
    expect(await screen.findByText("Loaded")).toBeTruthy();
  });
});
