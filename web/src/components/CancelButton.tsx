import { Button, type ButtonProps } from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";

/** Secondary "Cancel" action, styled once so every form's Cancel matches. */
export function CancelButton(
  props: Omit<ButtonProps, "variant" | "children"> &
    Omit<ComponentPropsWithoutRef<"button">, keyof ButtonProps>,
) {
  return (
    <Button variant="subtle" {...props}>
      Cancel
    </Button>
  );
}
