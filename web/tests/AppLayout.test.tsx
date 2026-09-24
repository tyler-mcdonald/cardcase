import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, vi } from "vitest";
import { AppLayout } from "@/AppLayout";

vi.mock("@/features/auth/UserMenu", () => ({
  UserMenu: () => <div>User menu</div>,
}));

function renderLayout(initialEntry: string) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Home content</div>} />
            <Route path="other" element={<div>Other content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("AppLayout", () => {
  it("renders the header around the current page", () => {
    renderLayout("/other");

    screen.getByText("User menu");
    screen.getByText("Other content");
  });

  it("links the brand back home", () => {
    renderLayout("/other");

    fireEvent.click(screen.getByRole("link", { name: "Cardcase" }));

    screen.getByText("Home content");
  });
});
