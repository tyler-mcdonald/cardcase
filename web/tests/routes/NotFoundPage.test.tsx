import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "@/routes/NotFoundPage";

function renderNotFoundPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("NotFoundPage", () => {
  it("renders the not found heading", () => {
    renderNotFoundPage();

    expect(
      screen.getByRole("heading", { name: /404: page not found/i }).textContent,
    ).toBe("404: Page not found");
  });

  it("navigates back home when the button is clicked", () => {
    renderNotFoundPage();

    fireEvent.click(screen.getByRole("button", { name: /go to home page/i }));

    expect(screen.getByText("Home").textContent).toBe("Home");
  });
});
