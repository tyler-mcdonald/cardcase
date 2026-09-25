import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsPage } from "@/routes/AccountsPage";
import { createAccount, listAccounts } from "@/features/accounts/api";
import type { Account } from "@/features/accounts/types";
import { ApiError } from "@/lib/api/errors";
import { makeAccount } from "../features/accounts/factories";
import { renderWithProviders } from "../render";

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
  createAccount: vi.fn(),
}));

const mockedListAccounts = vi.mocked(listAccounts);
const mockedCreateAccount = vi.mocked(createAccount);

function page(
  results: Account[],
  { count = results.length, hasNext = false } = {},
) {
  return {
    count,
    next: hasNext ? "http://localhost:8000/v1/accounts?page=next" : null,
    previous: null,
    results,
  };
}

function renderPage(route = "/") {
  return renderWithProviders(<AccountsPage />, { route });
}

async function createAccountNamed(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Add account" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
    target: { value: name },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add account" }));
}

function mockPendingCreate() {
  let resolve: (account: Account) => void = () => {};
  mockedCreateAccount.mockReturnValueOnce(
    new Promise((resolvePromise) => {
      resolve = resolvePromise;
    }),
  );
  return (account: Account) => resolve(account);
}

async function closeDialogWhileCreating() {
  await waitFor(() => expect(mockedCreateAccount).toHaveBeenCalled());
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
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
    mockedListAccounts.mockImplementation(async (requestedPage) =>
      requestedPage === 1
        ? page([makeAccount({ name: "Starbucks" })])
        : page([makeAccount({ id: "2", name: "Amazon" })]),
    );
    mockedCreateAccount.mockResolvedValueOnce(
      makeAccount({ name: "Starbucks" }),
    );

    renderPage("/?page=2");
    await screen.findByText("Amazon");

    await createAccountNamed("Starbucks");

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenLastCalledWith(1);
  });

  it("returns to the first page when the modal closes before creation finishes", async () => {
    mockedListAccounts.mockImplementation(async (requestedPage) =>
      requestedPage === 1
        ? page([makeAccount({ name: "Starbucks" })])
        : page([makeAccount({ id: "2", name: "Amazon" })]),
    );
    const resolveCreate = mockPendingCreate();

    renderPage("/?page=2");
    await screen.findByText("Amazon");

    await createAccountNamed("Starbucks");
    await closeDialogWhileCreating();
    resolveCreate(makeAccount({ name: "Starbucks" }));

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    expect(mockedListAccounts).toHaveBeenLastCalledWith(1);
  });

  it("keeps a reopened modal open when an earlier creation finishes", async () => {
    mockedListAccounts
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([makeAccount({ name: "Starbucks" })]));
    const resolveCreate = mockPendingCreate();

    renderPage();
    await screen.findByText("No accounts yet.");

    await createAccountNamed("Starbucks");
    await closeDialogWhileCreating();
    fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    const nameInput = await screen.findByRole("textbox", { name: /^name/i });
    fireEvent.change(nameInput, { target: { value: "Amazon" } });
    resolveCreate(makeAccount({ name: "Starbucks" }));

    expect(await screen.findByText("Starbucks")).toBeTruthy();
    await expect(
      waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), {
        timeout: 500,
      }),
    ).rejects.toThrow();
    expect((nameInput as HTMLInputElement).value).toBe("Amazon");
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
