import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { deleteAccount, updateAccount } from "@/features/accounts/api";
import { EditAccountModal } from "@/features/accounts/EditAccountModal";
import type { Account } from "@/features/accounts/types";
import { ApiError, GENERIC_ERROR } from "@/lib/api/errors";
import { renderWithProviders } from "../../render";
import { makeAccount } from "./factories";

vi.mock("@/features/accounts/api", () => ({
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

const mockedUpdateAccount = vi.mocked(updateAccount);
const mockedDeleteAccount = vi.mocked(deleteAccount);

const account = makeAccount({
  id: "42",
  name: "Delta credit",
  type: "flight_credit",
  expires_on: "2026-12-31",
  description: "Cancelled flight",
});

function renderForm() {
  const onClose = vi.fn();
  const { rerender } = renderWithProviders(
    <EditAccountModal account={account} opened onClose={onClose} />,
  );
  function rerenderWith({
    opened,
    account: shown = account,
  }: {
    opened: boolean;
    account?: Account;
  }) {
    rerender(
      <EditAccountModal account={shown} opened={opened} onClose={onClose} />,
    );
  }
  return { onClose, rerenderWith };
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
}

function startDelete() {
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
}

function confirmDelete() {
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
}

describe("EditAccountModal", () => {
  it("prefills the account's current values", () => {
    renderForm();

    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: /^name/i }).value,
    ).toBe("Delta credit");
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
    const { onClose } = renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "  Delta voucher  " },
    });
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      name: "Delta voucher",
    });
  });

  it("saves a new expiration date as a calendar date", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onClose } = renderForm();

    fireEvent.change(
      screen.getByRole("textbox", { name: /expiration date/i }),
      { target: { value: "Jan 15, 2027" } },
    );
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedUpdateAccount).toHaveBeenCalledWith("42", {
      expires_on: "2027-01-15",
    });
  });

  it("saves a cleared expiration date as null", async () => {
    mockedUpdateAccount.mockResolvedValueOnce(account);
    const { onClose } = renderForm();

    fireEvent.change(
      screen.getByRole("textbox", { name: /expiration date/i }),
      { target: { value: "" } },
    );
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

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
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

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
    submit();

    expect(
      await screen.findByText(
        "Ensure this field has no more than 255 characters.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("textbox", { name: /^name/i })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the API's type error under the type field", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400, {
        type: ['"foo" is not a valid choice.'],
      }),
    );
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
    submit();

    expect(
      await screen.findByText('"foo" is not a valid choice.'),
    ).toBeTruthy();
  });

  it("asks for confirmation before deleting", () => {
    renderForm();

    startDelete();

    screen.getByRole("dialog", { name: "Delete Delta credit?" });
    screen.getByText(/removes the account and its transaction history/i);
    expect(screen.queryByRole("textbox", { name: /^name/i })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" }),
    );
    expect(mockedDeleteAccount).not.toHaveBeenCalled();
  });

  it("returns to the form when deleting is cancelled", () => {
    const { onClose } = renderForm();

    startDelete();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    screen.getByRole("dialog", { name: "Edit account" });
    screen.getByRole("textbox", { name: /^name/i });
    expect(mockedDeleteAccount).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps unsaved changes when deleting is cancelled", () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
    startDelete();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: /^name/i }).value,
    ).toBe("Delta voucher");
  });

  it("deletes the account once confirmed", async () => {
    mockedDeleteAccount.mockResolvedValueOnce(undefined);
    const { onClose } = renderForm();

    startDelete();
    confirmDelete();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedDeleteAccount).toHaveBeenCalledWith("42");
  });

  it("treats an account that's already gone as deleted", async () => {
    mockedDeleteAccount.mockRejectedValueOnce(
      new ApiError("Not found", 404, { detail: "Not found." }),
    );
    const { onClose } = renderForm();

    startDelete();
    confirmDelete();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an error when the delete request isn't handled by the API", async () => {
    mockedDeleteAccount.mockRejectedValueOnce(
      new ApiError("Not found", 404, null),
    );
    const { onClose } = renderForm();

    startDelete();
    confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows an error when the account can't be deleted", async () => {
    mockedDeleteAccount.mockRejectedValueOnce(
      new ApiError("Server error", 500),
    );
    const { onClose } = renderForm();

    startDelete();
    confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(GENERIC_ERROR);
    screen.getByRole("dialog", { name: "Delete Delta credit?" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears a failed delete's error when returning to the form", async () => {
    mockedDeleteAccount.mockRejectedValueOnce(
      new ApiError("Server error", 500),
    );
    renderForm();

    startDelete();
    confirmDelete();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    startDelete();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears a failed save's error when starting to delete", async () => {
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
    submit();
    await screen.findByRole("alert");
    startDelete();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("can't be closed while the account is being deleted", async () => {
    mockedDeleteAccount.mockReturnValueOnce(new Promise(() => {}));
    const { onClose } = renderForm();

    startDelete();
    confirmDelete();

    await waitFor(() =>
      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Cancel" })
          .disabled,
      ).toBe(true),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("can't start deleting while changes are being saved", async () => {
    mockedUpdateAccount.mockReturnValueOnce(new Promise(() => {}));
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "Delta voucher" },
    });
    submit();

    await waitFor(() =>
      expect(
        screen.getByRole<HTMLButtonElement>("button", {
          name: "Delete account",
        }).disabled,
      ).toBe(true),
    );
  });

  it("closes from the confirmation and reopens on the form", async () => {
    vi.useFakeTimers();
    const { onClose, rerenderWith } = renderForm();

    startDelete();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalled();

    rerenderWith({ opened: false });
    await act(() => vi.runAllTimersAsync());
    rerenderWith({ opened: true });
    vi.useRealTimers();

    screen.getByRole("textbox", { name: /^name/i });
  });

  it("opens another account on the form, not its confirmation", () => {
    const other = makeAccount({ id: "43", name: "United credit" });
    const { rerenderWith } = renderForm();

    startDelete();
    rerenderWith({ opened: false });
    rerenderWith({ account: other, opened: true });

    screen.getByRole("dialog", { name: "Edit account" });
  });
});
