import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { updateAccount } from "@/features/accounts/api";
import { EditAccountModal } from "@/features/accounts/EditAccountModal";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { getTextbox } from "../../queries";
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
  const onClose = vi.fn();
  renderWithProviders(
    <EditAccountModal account={account} opened onClose={onClose} />,
  );
  return { onClose };
}

function nameInput() {
  return getTextbox(/^name/i);
}

function expirationInput() {
  return getTextbox(/expiration date/i);
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
}

describe("EditAccountModal", () => {
  it("prefills the account's current values", () => {
    renderForm();

    expect(nameInput().value).toBe("Delta credit");
    expect(
      screen.getByRole<HTMLInputElement>("radio", { name: "Flight credit" })
        .checked,
    ).toBe(true);
    expect(expirationInput().value).toBe("Dec 31, 2026");
    expect(getTextbox(/description/i).value).toBe("Cancelled flight");
  });

  it("locks the account type", () => {
    renderForm();

    for (const radio of screen.getAllByRole<HTMLInputElement>("radio")) {
      expect(radio.disabled).toBe(true);
    }
  });

  it("saves only the changed values to the account", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onClose } = renderForm();

    fireEvent.change(nameInput(), { target: { value: "  Delta voucher  " } });
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      name: "Delta voucher",
    });
  });

  it("saves a new expiration date as a calendar date", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onClose } = renderForm();

    fireEvent.change(expirationInput(), { target: { value: "Jan 15, 2027" } });
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      expires_on: "2027-01-15",
    });
  });

  it("saves a cleared expiration date as null", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onClose } = renderForm();

    fireEvent.change(expirationInput(), { target: { value: "" } });
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      expires_on: null,
    });
  });

  it("closes without saving when nothing changed", () => {
    const { onClose } = renderForm();

    submit();

    expect(onClose).toHaveBeenCalled();
    expect(mockedUpdateAccount).not.toHaveBeenCalled();
  });

  it("shows an error when the account can't be saved", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );
    const { onClose } = renderForm();

    fireEvent.change(nameInput(), { target: { value: "Delta voucher" } });
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the API's field errors on the matching field", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400, {
        name: ["Ensure this field has no more than 255 characters."],
      }),
    );
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Delta voucher" } });
    submit();

    expect(
      await screen.findByText(
        "Ensure this field has no more than 255 characters.",
      ),
    ).toBeTruthy();
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the API's type error under the type field", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400, {
        type: ['"foo" is not a valid choice.'],
      }),
    );
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Delta voucher" } });
    submit();

    expect(
      await screen.findByText('"foo" is not a valid choice.'),
    ).toBeTruthy();
  });
});
