import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateField, type DateFieldProps } from "@/components/DateField";
import { renderWithProviders } from "@tests/render";
import { mockMobileViewport } from "@tests/viewport";

const onChange = vi.fn();

function renderField(props: Partial<DateFieldProps> = {}) {
  renderWithProviders(
    <DateField label="Due" value="2027-03-31" onChange={onChange} {...props} />,
  );
}

function getInput() {
  return screen.getByLabelText<HTMLInputElement>("Due");
}

describe("DateField on desktop", () => {
  it("shows the date in the display format", () => {
    renderField();

    expect(getInput().value).toBe("Mar 31, 2027");
  });

  it("saves a typed date as a calendar date", () => {
    renderField({ value: null });

    fireEvent.change(getInput(), { target: { value: "Jan 15, 2027" } });

    expect(onChange).toHaveBeenLastCalledWith("2027-01-15");
  });
});

describe("DateField on mobile", () => {
  it("uses the phone's date picker", () => {
    mockMobileViewport();
    renderField();

    expect(getInput().type).toBe("date");
    expect(getInput().value).toBe("2027-03-31");
  });

  it("saves a picked date as a calendar date", () => {
    mockMobileViewport();
    renderField();

    fireEvent.change(getInput(), { target: { value: "2027-01-15" } });

    expect(onChange).toHaveBeenCalledWith("2027-01-15");
  });

  it("saves an emptied date as null", () => {
    mockMobileViewport();
    renderField();

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clears the date with the clear button", () => {
    mockMobileViewport();
    renderField();

    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("hides the clear button when there's no date", () => {
    mockMobileViewport();
    renderField({ value: null });

    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("hides the clear button when it isn't clearable", () => {
    mockMobileViewport();
    renderField({ clearable: false });

    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });
});
