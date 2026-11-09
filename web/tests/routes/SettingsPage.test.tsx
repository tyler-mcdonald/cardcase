import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteMe } from "@/features/auth/api";
import { SettingsPage } from "@/routes/SettingsPage";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { mockSignedInUser, TEST_USER } from "../features/auth/fixtures";
import { renderWithProviders } from "../render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/api");

const mockedDeleteMe = vi.mocked(deleteMe);

beforeEach(() => {
  mockSignedInUser();
});

function renderSettings() {
  renderWithProviders(
    <Routes>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/login" element={<p>Login page</p>} />
    </Routes>,
    { route: "/settings" },
  );
}

function openDeleteModal() {
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  return screen.getByLabelText<HTMLInputElement>(/to confirm/);
}

function typePhrase(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function deleteButton() {
  return screen.getByRole<HTMLButtonElement>("button", { name: "Delete" });
}

it("renders the settings heading", () => {
  renderSettings();

  screen.getByRole("heading", { name: "Settings" });
});

it("shows the signed-in user's email read-only in the account section", () => {
  renderSettings();

  screen.getByRole("heading", { name: "Account" });
  const email = screen.getByLabelText<HTMLInputElement>("Email");
  expect(email.value).toBe(TEST_USER.email);
  expect(email.readOnly).toBe(true);
});

describe("delete account", () => {
  it("shows a delete account section with a delete account button", () => {
    renderSettings();

    screen.getByRole("heading", { name: "Delete account" });
    screen.getByRole("button", { name: "Delete account" });
  });

  it("asks the user to type the confirmation phrase with their email", () => {
    renderSettings();

    openDeleteModal();

    screen.getByText(`delete account ${TEST_USER.email}`);
  });

  it("keeps Delete disabled until the phrase matches", () => {
    renderSettings();
    const input = openDeleteModal();

    expect(deleteButton().disabled).toBe(true);

    typePhrase(input, "delete account");
    expect(deleteButton().disabled).toBe(true);

    typePhrase(input, "delete account other@example.com");
    expect(deleteButton().disabled).toBe(true);

    typePhrase(input, `Delete account ${TEST_USER.email}`);
    expect(deleteButton().disabled).toBe(true);

    typePhrase(input, `delete account ${TEST_USER.email}`);
    expect(deleteButton().disabled).toBe(false);
  });

  it("matches the email case-insensitively and ignores surrounding whitespace", () => {
    renderSettings();
    const input = openDeleteModal();

    typePhrase(input, `  delete account ${TEST_USER.email.toUpperCase()}  `);

    expect(deleteButton().disabled).toBe(false);
  });

  it("blocks pasting and dropping into the confirmation input", () => {
    renderSettings();
    const input = openDeleteModal();

    expect(fireEvent.paste(input)).toBe(false);
    expect(fireEvent.drop(input)).toBe(false);
  });

  it("turns off auto-capitalization and autocorrect on the confirmation input", () => {
    renderSettings();
    const input = openDeleteModal();

    expect(input.getAttribute("autocapitalize")).toBe("none");
    expect(input.getAttribute("autocorrect")).toBe("off");
  });

  it("deletes the account and redirects to the login page", async () => {
    mockedDeleteMe.mockResolvedValue(null);
    renderSettings();
    const input = openDeleteModal();

    typePhrase(input, `delete account ${TEST_USER.email}`);
    fireEvent.click(deleteButton());

    await screen.findByText("Login page");
    expect(mockedDeleteMe).toHaveBeenCalledTimes(1);
  });

  it("ignores repeat submits while the deletion is pending", async () => {
    mockedDeleteMe.mockReturnValue(new Promise(() => {}));
    renderSettings();
    const input = openDeleteModal();

    typePhrase(input, `delete account ${TEST_USER.email}`);
    fireEvent.submit(input.closest("form")!);
    await waitFor(() =>
      expect(deleteButton().hasAttribute("data-loading")).toBe(true),
    );
    fireEvent.submit(input.closest("form")!);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    expect(mockedDeleteMe).toHaveBeenCalledTimes(1);
  });

  it("shows an error and stays on the page when deletion fails", async () => {
    mockedDeleteMe.mockRejectedValue(new ApiError("Request failed (500)", 500));
    renderSettings();
    const input = openDeleteModal();

    typePhrase(input, `delete account ${TEST_USER.email}`);
    fireEvent.click(deleteButton());

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(screen.queryByText("Login page")).toBeNull();
  });
});
