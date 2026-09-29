import { fireEvent, screen, within } from "@testing-library/react";

export function getTextbox(name: string | RegExp, container?: HTMLElement) {
  const queries = container ? within(container) : screen;
  return queries.getByRole<HTMLInputElement>("textbox", { name });
}

export function changeTextbox(
  name: string | RegExp,
  value: string,
  container?: HTMLElement,
) {
  fireEvent.change(getTextbox(name, container), { target: { value } });
}
