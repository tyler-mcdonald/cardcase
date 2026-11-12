import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandNameInput } from "@/features/brands/BrandNameInput";
import type { Brand } from "@/features/brands/queries";
import { renderWithProviders } from "../../render";
import { searchedQueries, stubBrandSearch } from "./search";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
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

    type("star");
    fireEvent.click(await screen.findByRole("option"));

    expect(onBrandSelect).toHaveBeenCalledWith({
      name: "Starbucks",
      domain: "starbucks.com",
    });
    expect(nameInput().value).toBe("Starbucks");
    await waitFor(() => expect(screen.queryByRole("option")).toBeNull());
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
    const fetchMock = stubBrandSearch();
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => {}));
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
  });
});
