import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandNameInput } from "@/features/brands/BrandNameInput";
import type { Brand } from "@/features/brands/types";
import { renderWithProviders } from "../../render";
import {
  pickBrand,
  searchedQueries,
  stubBrandSearch,
  stubBrandSearchByQuery,
} from "./search";

afterEach(() => {
  vi.useRealTimers();
});

function Harness({
  initialName = "",
  onBrandSelect,
}: {
  initialName?: string;
  onBrandSelect: (brand: Brand) => void;
}) {
  const [name, setName] = useState(initialName);
  return (
    <BrandNameInput
      label="Name"
      value={name}
      onChange={setName}
      onBrandSelect={(brand) => {
        setName(brand.name);
        onBrandSelect(brand);
      }}
    />
  );
}

function renderInput(initialName?: string) {
  const onBrandSelect = vi.fn();
  renderWithProviders(
    <Harness initialName={initialName} onBrandSelect={onBrandSelect} />,
  );
  return { onBrandSelect };
}

function nameInput() {
  return screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
}

function type(value: string) {
  fireEvent.change(nameInput(), { target: { value } });
}

describe("BrandNameInput", () => {
  it("suggests brands with their domains", async () => {
    stubBrandSearch([
      { name: "Starbucks", domain: "starbucks.com" },
      { name: null, domain: "starbucks.ca" },
    ]);
    renderInput();

    type("Star");

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Starbucksstarbucks.com",
      "starbucks.castarbucks.ca",
    ]);
  });

  it("allows brands that share a name", async () => {
    stubBrandSearch([
      { name: "Delta", domain: "delta.com" },
      { name: "Delta", domain: "deltafaucet.com" },
    ]);
    const { onBrandSelect } = renderInput();

    type("Delta");
    fireEvent.click(await screen.findByText("deltafaucet.com"));

    expect(onBrandSelect).toHaveBeenCalledWith({
      name: "Delta",
      domain: "deltafaucet.com",
    });
  });

  it("fills the name and closes the suggestions when a brand is picked", async () => {
    stubBrandSearch([{ name: "Starbucks", domain: "starbucks.com" }]);
    const { onBrandSelect } = renderInput();

    await pickBrand("star");

    expect(onBrandSelect).toHaveBeenCalledWith({
      name: "Starbucks",
      domain: "starbucks.com",
    });
    expect(nameInput().value).toBe("Starbucks");
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
  });

  it("shows the suggestions again when the field is refocused", async () => {
    stubBrandSearch([{ name: "Starbucks", domain: "starbucks.com" }]);
    renderInput();

    type("Star");
    await screen.findByText("starbucks.com");
    fireEvent.blur(nameInput());
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
    fireEvent.focus(nameInput());

    expect(await screen.findByRole("option")).toBeTruthy();
  });

  it("shows the suggestions again when the focused field is clicked", async () => {
    stubBrandSearch([{ name: "Starbucks", domain: "starbucks.com" }]);
    renderInput();

    type("Star");
    await screen.findByText("starbucks.com");
    fireEvent.keyDown(nameInput(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
    fireEvent.click(nameInput());

    expect(await screen.findByRole("option")).toBeTruthy();
  });

  it("searches 300ms after typing stops", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const fetchMock = stubBrandSearch();
    renderInput();

    type("S");
    act(() => vi.advanceTimersByTime(200));
    type("St");
    act(() => vi.advanceTimersByTime(299));
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(searchedQueries(fetchMock)).toEqual(["St"]);
  });

  it("cancels the previous search when a new one starts", async () => {
    const fetchMock = stubBrandSearchByQuery({ Sta: [] });
    renderInput();

    type("St");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    type("Sta");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(searchedQueries(fetchMock)).toEqual(["St", "Sta"]);
  });

  it("doesn't search for the initial name", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const fetchMock = stubBrandSearch();
    renderInput("Starbucks");

    act(() => vi.advanceTimersByTime(1000));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never searches without a client ID", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const fetchMock = stubBrandSearch([
      { name: "Starbucks", domain: "starbucks.com" },
    ]);
    vi.stubEnv("VITE_BRANDFETCH_CLIENT_ID", "");
    renderInput();

    type("Starbucks");
    act(() => vi.advanceTimersByTime(1000));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(nameInput().value).toBe("Starbucks");
    expect(screen.queryByRole("option")).toBeNull();
    expect(nameInput().hasAttribute("data-expanded")).toBe(false);
  });

  it("doesn't pick a stale highlighted brand after the results change", async () => {
    stubBrandSearchByQuery({
      Star: [
        { name: "Star Market", domain: "starmarket.com" },
        { name: "Starz", domain: "starz.com" },
      ],
      Starb: [
        { name: "Starburst", domain: "starburst.com" },
        { name: "Starbucks", domain: "starbucks.com" },
      ],
    });
    const { onBrandSelect } = renderInput();

    type("Star");
    await screen.findByText("starz.com");
    fireEvent.keyDown(nameInput(), { code: "ArrowDown" });
    fireEvent.keyDown(nameInput(), { code: "ArrowDown" });
    type("Starb");
    await screen.findByText("starburst.com");
    fireEvent.keyDown(nameInput(), { code: "Enter" });

    expect(onBrandSelect).not.toHaveBeenCalled();
    expect(nameInput().value).toBe("Starb");
  });

  it("doesn't pick a highlighted brand after the name is edited", async () => {
    stubBrandSearch([
      { name: "Star Market", domain: "starmarket.com" },
      { name: "Starz", domain: "starz.com" },
    ]);
    const { onBrandSelect } = renderInput();

    type("Star");
    await screen.findByText("starz.com");
    fireEvent.keyDown(nameInput(), { code: "ArrowDown" });
    type("Starb");
    fireEvent.keyDown(nameInput(), { code: "Enter" });

    expect(onBrandSelect).not.toHaveBeenCalled();
    expect(nameInput().value).toBe("Starb");
  });

  it.each([
    { when: "the text is refined", typed: ["Starb"], kept: true },
    { when: "the text changes", typed: ["Nike"], kept: false },
    { when: "the field is cleared", typed: ["", "S"], kept: false },
  ])(
    "when $when, keeps the previous results while loading: $kept",
    async ({ typed, kept }) => {
      const fetchMock = stubBrandSearchByQuery({
        Star: [{ name: "Starz", domain: "starz.com" }],
      });
      renderInput();

      type("Star");
      await screen.findByText("starz.com");
      typed.forEach(type);
      expect(screen.queryByText("starz.com") !== null).toBe(kept);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

      expect(screen.queryByText("starz.com") !== null).toBe(kept);
    },
  );

  it("keeps the suggestions closed when there are no results", async () => {
    stubBrandSearch([]);
    const queryClient = new QueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <Harness onBrandSelect={vi.fn()} />
      </QueryClientProvider>,
    );

    type("Zzz");
    await waitFor(() =>
      expect(
        queryClient.getQueryState(["brands", "search", "Zzz"])?.status,
      ).toBe("success"),
    );

    expect(screen.queryByRole("option")).toBeNull();
    expect(nameInput().hasAttribute("data-expanded")).toBe(false);
    expect(nameInput().hasAttribute("data-mantine-stop-propagation")).toBe(
      false,
    );
  });
});
