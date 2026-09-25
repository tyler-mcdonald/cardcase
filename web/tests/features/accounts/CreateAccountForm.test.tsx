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

function fillName(value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Add account" }));
}

describe("CreateAccountForm", () => {
  it("creates the account from the entered values", async () => {
    mockedCreateAccount.mockResolvedValueOnce(makeAccount());
    const { onCreated } = renderForm();

    fillName("  Delta credit  ");
    fireEvent.click(screen.getByRole("radio", { name: "Flight credit" }));
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "Cancelled flight" },
    });
    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(mockedCreateAccount.mock.calls[0][0]).toEqual({
      name: "Delta credit",
      type: "flight_credit",
      description: "Cancelled flight",
      expires_on: null,
    });
  });

  it("requires a name", async () => {
    renderForm();

    fillName("   ");
    submit();

    expect(await screen.findByText("Name is required")).toBeTruthy();
    expect(mockedCreateAccount).not.toHaveBeenCalled();
  });

  it("shows an error when the account can't be created", async () => {
    mockedCreateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );
    const { onCreated } = renderForm();

    fillName("Amazon");
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
