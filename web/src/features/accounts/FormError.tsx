import { Alert } from "@mantine/core";

export function FormError({ message }: { message: string }) {
  return (
    <Alert color="red" role="alert">
      {message}
    </Alert>
  );
}
