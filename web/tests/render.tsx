import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: { route?: string } = {},
) {
  return render(
    <MantineProvider>
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  );
}
