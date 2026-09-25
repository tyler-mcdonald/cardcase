import { Button, Group, Text } from "@mantine/core";
import { useLogout } from "./queries";
import { useAuth } from "./use-auth";

export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <Group gap="md">
      <Text size="sm" c="dimmed">
        {user?.email}
      </Text>
      <Button variant="default" size="xs" onClick={() => logout.mutate()}>
        Log out
      </Button>
    </Group>
  );
}
