import { Group, Text } from "@mantine/core";
import { useAuth } from "./use-auth";
import { UserMenu } from "./UserMenu";

export function HeaderAccount() {
  const { user } = useAuth();
  const email = user?.email ?? "";

  return (
    <Group gap="sm">
      <Text size="sm" c="dimmed">
        {email}
      </Text>
      <UserMenu email={email} />
    </Group>
  );
}
