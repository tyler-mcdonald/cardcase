import { Alert, type AlertProps } from "@mantine/core";

export function FormError({
  message,
  ...alertProps
}: { message: string } & Omit<AlertProps, "color" | "role" | "children">) {
  return (
    <Alert color="red" role="alert" {...alertProps}>
      {message}
    </Alert>
  );
}
