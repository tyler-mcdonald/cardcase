import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DeleteUserAccountModal } from "@/features/auth/DeleteUserAccountModal";
import { useAuth } from "@/features/auth/use-auth";

export function SettingsPage() {
  const { user } = useAuth();
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

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
          <TextInput label="Email" value={user?.email ?? ""} readOnly />
        </Stack>
      </Paper>

      <Paper
        withBorder
        p="lg"
        radius="md"
        component="section"
        style={{ borderColor: "var(--mantine-color-red-outline)" }}
      >
        <Stack gap="md">
          <Title order={2} size="h4">
            Danger zone
          </Title>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">
              Permanently delete your account and all of your data.
            </Text>
            <Button color="red" onClick={openDelete}>
              Delete account
            </Button>
          </Group>
        </Stack>
      </Paper>

      {user && (
        <DeleteUserAccountModal
          email={user.email}
          opened={deleteOpened}
          onClose={closeDelete}
        />
      )}
    </Stack>
  );
}
