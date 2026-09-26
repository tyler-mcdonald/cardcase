import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { updateAccount } from "@/features/accounts/api";
import { EditAccountForm } from "@/features/accounts/EditAccountForm";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { renderWithProviders } from "../../render";
import { makeAccount } from "./factories";

vi.mock("@/features/accounts/api", () => ({
  updateAccount: vi.fn(),
}));

const mockedUpdateAccount = vi.mocked(updateAccount);

const account = makeAccount({
  id: "42",
  name: "Delta credit",
  type: "flight_credit",
  expires_on: "2026-12-31",
  description: "Cancelled flight",
});

function renderForm() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <EditAccountForm account={account} onSaved={onSaved} onCancel={onCancel} />,
  );
  return { onSaved, onCancel };
}

function nameInput() {
  return screen.getByRole<HTMLInputElement>("textbox", { name: /^name/i });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
}

describe("EditAccountForm", () => {
  it("prefills the account's current values", () => {
    renderForm();

    expect(nameInput().value).toBe("Delta credit");
    expect(
      screen.getByRole<HTMLInputElement>("radio", { name: "Flight credit" })
        .checked,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLInputElement>("textbox", {
        name: /expiration date/i,
      }).value,
    ).toBe("Dec 31, 2026");
    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: /description/i })
        .value,
    ).toBe("Cancelled flight");
  });

  it("locks the account type", () => {
    renderForm();

    for (const radio of screen.getAllByRole<HTMLInputElement>("radio")) {
      expect(radio.disabled).toBe(true);
    }
  });

  it("saves only the changed values to the account", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onSaved } = renderForm();

    fireEvent.change(nameInput(), { target: { value: "  Delta voucher  " } });
    submit();

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      name: "Delta voucher",
    });
  });

  it("closes without saving when nothing changed", () => {
    const { onSaved } = renderForm();

    submit();

    expect(onSaved).toHaveBeenCalled();
    expect(mockedUpdateAccount).not.toHaveBeenCalled();
  });

  it("shows an error when the account can't be saved", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );
    const { onSaved } = renderForm();

    fireEvent.change(nameInput(), { target: { value: "Delta voucher" } });
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(onSaved).not.toHaveBeenCalled();
  });
});
