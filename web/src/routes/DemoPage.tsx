import { Container, Stack, Title } from "@mantine/core";
import { DemoEntry } from "@/features/auth/DemoEntry";
import { APP_NAME } from "@/lib/constants";

export function DemoPage() {
  return (
    <Container size={420} pt="15vh">
      <Stack component="main" gap="xl">
        <Title order={1} ta="center">
          {APP_NAME}
        </Title>
        <DemoEntry />
      </Stack>
    </Container>
  );
}
