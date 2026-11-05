import { Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useAuth } from "@/features/auth/use-auth";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Settings
      </Title>

      <Paper withBorder p="lg" radius="md" component="section">
        <Stack gap="md">
          <div>
            <Title order={2} size="h4">
              Account
            </Title>
            <Text c="dimmed" size="sm">
              The account you're signed in with.
            </Text>
          </div>
          <TextInput label="Email" value={user?.email ?? ""} readOnly />
        </Stack>
      </Paper>
    </Stack>
  );
}
