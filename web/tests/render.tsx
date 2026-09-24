import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { TestProviders } from "./TestProviders";

export function renderWithProviders(
  ui: ReactElement,
  { route }: { route?: string } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route}>{children}</TestProviders>
    ),
  });
}
