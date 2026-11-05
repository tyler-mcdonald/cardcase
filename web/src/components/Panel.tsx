import type { ReactNode } from "react";
import { Paper } from "@mantine/core";

export function Panel({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <Paper component="section" withBorder radius="md" p={padded ? "lg" : 0}>
      {children}
    </Paper>
  );
}
