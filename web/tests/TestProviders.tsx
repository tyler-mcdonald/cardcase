import { useState, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function TestProviders({
  children,
  route = "/",
}: {
  children: ReactNode;
  route?: string;
}) {
  const [queryClient] = useState(createTestQueryClient);
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
}
