import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { FormError } from "@/components/FormError";
import { useLogout } from "@/features/auth/queries";
import { useAuth } from "@/features/auth/use-auth";
import { apiErrorMessage } from "@/lib/api/errors";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Settings
      </Title>

      <Paper withBorder p="lg" radius="md" component="section">
        <Stack gap="md">
          <Title order={2} size="h4">
            Account
          </Title>
          {user?.is_demo ? (
            <DemoAccountNotice />
          ) : (
            <TextInput label="Email" value={user?.email ?? ""} readOnly />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function DemoAccountNotice() {
  const logout = useLogout();

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" c="dimmed">
          You're using a temporary demo account. Sign up to use cardcase with
          your own data.
        </Text>
        <Button
          variant="default"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          style={{ flexShrink: 0 }}
        >
          Sign up
        </Button>
      </Group>
      {logout.error && <FormError message={apiErrorMessage(logout.error)} />}
    </Stack>
  );
}
