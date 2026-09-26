import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAccount } from "@/features/accounts/api";
import { CreateAccountForm } from "@/features/accounts/CreateAccountForm";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { renderWithProviders } from "../../render";
import { makeAccount } from "./factories";

vi.mock("@/features/accounts/api", () => ({
  createAccount: vi.fn(),
}));

const mockedCreateAccount = vi.mocked(createAccount);

function renderForm() {
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CreateAccountForm onCreated={onCreated} onCancel={onCancel} />,
  );
  return { onCreated, onCancel };
}

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Add account" }));
}

function submittedInput() {
  return mockedCreateAccount.mock.calls[0][0];
}

describe("CreateAccountForm", () => {
  it("creates the account from the entered values", async () => {
    mockedCreateAccount.mockResolvedValueOnce(makeAccount());
    const { onCreated } = renderForm();

    fillField(/^name/i, "  Delta credit  ");
    fireEvent.click(screen.getByRole("radio", { name: "Flight credit" }));
    fillField(/description/i, "Cancelled flight");
    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(submittedInput()).toEqual({
      name: "Delta credit",
      type: "flight_credit",
      description: "Cancelled flight",
      expires_on: null,
    });
  });

  it("submits the expiration date as a calendar date", async () => {
    mockedCreateAccount.mockResolvedValueOnce(makeAccount());
    const { onCreated } = renderForm();

    fillField(/^name/i, "Starbucks");
    fillField(/expiration date/i, "Dec 31, 2026");
    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(submittedInput()).toMatchObject({
      expires_on: "2026-12-31",
    });
  });

  it("requires a name", async () => {
    renderForm();

    fillField(/^name/i, "   ");
    submit();

    expect(await screen.findByText("Name is required")).toBeTruthy();
    expect(mockedCreateAccount).not.toHaveBeenCalled();
  });

  it("shows an error when the account can't be created", async () => {
    mockedCreateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );
    const { onCreated } = renderForm();

    fillField(/^name/i, "Amazon");
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("cancels without creating", () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
    expect(mockedCreateAccount).not.toHaveBeenCalled();
  });
});
