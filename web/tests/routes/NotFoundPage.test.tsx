import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { renderWithProviders } from "../render";

function renderNotFoundPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>,
    { route: "/does-not-exist" },
  );
}

describe("NotFoundPage", () => {
  it("renders the not found heading", () => {
    renderNotFoundPage();

    expect(
      screen.getByRole("heading", { name: /404: not found/i }).textContent,
    ).toBe("404: Not Found");
  });

  it("navigates back home when the button is clicked", () => {
    renderNotFoundPage();

    fireEvent.click(screen.getByRole("button", { name: /go to home page/i }));

    expect(screen.getByText("Home").textContent).toBe("Home");
  });
});
