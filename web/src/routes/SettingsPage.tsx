import { Stack, TextInput, Title } from "@mantine/core";
import { Panel } from "@/components/Panel";
import { useAuth } from "@/features/auth/use-auth";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Settings
      </Title>

      <Panel>
        <Stack gap="md">
          <Title order={2} size="h4">
            Account
          </Title>
          <TextInput label="Email" value={user?.email ?? ""} readOnly />
        </Stack>
      </Panel>
    </Stack>
  );
}
