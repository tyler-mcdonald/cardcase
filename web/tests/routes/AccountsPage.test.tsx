import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "@/routes/AccountsPage";
import {
  createAccount,
  listAccounts,
  updateAccount,
} from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import { ApiError } from "@/lib/api/errors";
import { makeAccount } from "../features/accounts/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
}));

const mockedListAccounts = vi.mocked(listAccounts);
const mockedCreateAccount = vi.mocked(createAccount);
const mockedUpdateAccount = vi.mocked(updateAccount);

function page(
  results: Account[],
  { count = results.length, hasNext = false } = {},
) {
  return {
    count,
    next: hasNext ? "http://api.test/v1/accounts?page=next" : null,
    previous: null,
    results,
  };
}

function renderPage(route = "/") {
  return renderWithProviders(<AccountsPage />, { route });
}

async function submitNameInDialog(name: string, submitLabel: string) {
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByRole("textbox", { name: /^name/i }), {
    target: { value: name },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: submitLabel }));
}

async function createAccountNamed(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Add account" }));
  await submitNameInDialog(name, "Add account");
}

async function openEditDialog(accountName: string) {
  fireEvent.click(screen.getByRole("button", { name: `Edit ${accountName}` }));
  return screen.findByRole("dialog");
}

async function renameAccount(currentName: string, newName: string) {
  await openEditDialog(currentName);
  await submitNameInDialog(newName, "Save changes");
}

async function expectDialogLockedWhileSaving() {
  const dialog = screen.getByRole("dialog");
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveProperty("disabled", true),
  );
  fireEvent.keyDown(dialog, { key: "Escape" });

  expect(screen.queryByRole("dialog")).not.toBeNull();
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("AccountsPage", () => {
  it("shows the user's accounts once loaded", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([
        makeAccount({ name: "Starbucks" }),
        makeAccount({
          id: "2",
          name: "Delta SkyMiles Credit",
          type: "flight_credit",
        }),
      ]),
    );

    renderPage();

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.getByText("Delta SkyMiles Credit")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: "2" })).toBeNull();
  });

  it("shows an empty message when there are no accounts", async () => {
    mockedListAccounts.mockResolvedValueOnce(page([]));

    renderPage();

    expect(await screen.findByText("No accounts yet.")).toBeTruthy();
    expect(
      screen.getByText(
        "Add a gift card or flight credit to start tracking it.",
      ),
    ).toBeTruthy();
  });

  it("creates an account and shows it in the list", async () => {
    mockedListAccounts
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([makeAccount({ name: "Starbucks" })]));
    mockedCreateAccount.mockResolvedValueOnce(
      makeAccount({ name: "Starbucks" }),
    );

    renderPage();
    await screen.findByText("No accounts yet.");

    await createAccountNamed("Starbucks");

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mockedListAccounts).toHaveBeenCalledTimes(2);
  });

  it("returns to the first page after creating an account", async () => {
    const newAccount = makeAccount({ name: "Starbucks" });
    const accountsByPage: Record<number, Account[]> = {
      1: [newAccount],
      2: [makeAccount({ id: "2", name: "Amazon" })],
    };
    mockedListAccounts.mockImplementation(async (requestedPage) =>
      page(accountsByPage[requestedPage]),
    );
    mockedCreateAccount.mockResolvedValueOnce(newAccount);

    renderPage("/?page=2");
    await screen.findByText("Amazon");

    await createAccountNamed("Starbucks");

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.queryByText("Amazon")).toBeNull();
  });

  it("keeps the modal open while the account is being created", async () => {
    mockedListAccounts.mockResolvedValue(page([]));
    mockedCreateAccount.mockReturnValueOnce(new Promise(() => {}));

    renderPage();
    await screen.findByText("No accounts yet.");

    await createAccountNamed("Starbucks");

    await expectDialogLockedWhileSaving();
  });

  it("edits an account and shows the change in place", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ id: "2", name: "Amazon" })]),
    );
    mockedUpdateAccount.mockResolvedValueOnce(
      makeAccount({ id: "2", name: "Amazon Prime" }),
    );

    renderPage("/?page=2");
    await screen.findByText("Amazon");

    await renameAccount("Amazon", "Amazon Prime");

    expect(await screen.findByText("Amazon Prime")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mockedUpdateAccount.mock.calls[0][0]).toBe("2");
    expect(mockedListAccounts).toHaveBeenCalledTimes(1);
  });

  it("keeps the modal open while the account is being saved", async () => {
    mockedListAccounts.mockResolvedValue(
      page([makeAccount({ name: "Amazon" })]),
    );
    mockedUpdateAccount.mockReturnValueOnce(new Promise(() => {}));

    renderPage();
    await screen.findByText("Amazon");

    await renameAccount("Amazon", "Amazon Prime");

    await expectDialogLockedWhileSaving();
  });

  it("refreshes the list after a failed save and resends only the user's edits", async () => {
    mockedListAccounts
      .mockResolvedValueOnce(page([makeAccount({ id: "2", name: "Amazon" })]))
      .mockResolvedValueOnce(
        page([makeAccount({ id: "2", name: "Renamed elsewhere" })]),
      );
    mockedUpdateAccount
      .mockRejectedValueOnce(new ApiError("Server error", 500))
      .mockResolvedValueOnce(makeAccount({ id: "2", name: "Amazon" }));

    renderPage();
    await screen.findByText("Amazon");

    const dialog = await openEditDialog("Amazon");
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: /description/i }),
      { target: { value: "Birthday gift" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Renamed elsewhere")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedUpdateAccount).toHaveBeenCalledTimes(2));
    expect(mockedUpdateAccount).toHaveBeenLastCalledWith("2", {
      description: "Birthday gift",
    });
  });

  it("doesn't refresh the list after a rejected save", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ id: "2", name: "Amazon" })]),
    );
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400, { name: ["Too long."] }),
    );

    renderPage();
    await screen.findByText("Amazon");
    await renameAccount("Amazon", "Amazon gift card");

    expect(await screen.findByText("Too long.")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenCalledTimes(1);
  });

  it("clears a failed save's error when the account is reopened", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ id: "2", name: "Amazon" })]),
    );
    mockedUpdateAccount.mockRejectedValueOnce(
      new ApiError("Request failed (400)", 400),
    );

    renderPage();
    await screen.findByText("Amazon");
    await renameAccount("Amazon", "Amazon gift card");
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await openEditDialog("Amazon");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an error state and can retry", async () => {
    mockedListAccounts.mockRejectedValueOnce(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Couldn't load your accounts")).toBeTruthy();

    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ name: "Amazon" })]),
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Amazon")).toBeTruthy();
  });

  it("loads the page named in the URL", async () => {
    mockedListAccounts.mockResolvedValueOnce(
      page([makeAccount({ name: "Target" })]),
    );

    renderPage("/?page=3");

    expect(await screen.findByText("Target")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenCalledWith(3);
  });

  it("paginates through the accounts", async () => {
    mockedListAccounts
      .mockResolvedValueOnce(
        page([makeAccount({ name: "Starbucks" })], { count: 3, hasNext: true }),
      )
      .mockResolvedValueOnce(
        page([makeAccount({ id: "2", name: "Amazon" })], { count: 3 }),
      );

    renderPage();

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(screen.getByRole("button", { name: "3" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(await screen.findByText("Amazon")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenLastCalledWith(2);
  });

  it("falls back to the first page when the requested page doesn't exist", async () => {
    mockedListAccounts
      .mockRejectedValueOnce(new ApiError("Not found", 404))
      .mockResolvedValueOnce(page([makeAccount({ name: "Starbucks" })]));

    renderPage("/?page=9");

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenNthCalledWith(1, 9);
    expect(mockedListAccounts).toHaveBeenLastCalledWith(1);
    expect(screen.queryByText("Couldn't load your accounts")).toBeNull();
  });
});
