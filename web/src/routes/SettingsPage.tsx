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
import type { ReactNode } from "react";
import { DeleteUserAccountModal } from "@/features/auth/DeleteUserAccountModal";
import { useAuth } from "@/features/auth/use-auth";

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper withBorder p="lg" radius="md" component="section">
      <Stack gap="md">
        <Title order={2} size="h4">
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Settings
      </Title>

      <SettingsSection title="Account">
        <TextInput label="Email" value={user?.email ?? ""} readOnly />
      </SettingsSection>

      <SettingsSection title="Delete account">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">
            Permanently delete your account and all of your data.
          </Text>
          <Button color="red" onClick={openDelete}>
            Delete account
          </Button>
        </Group>
      </SettingsSection>

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
