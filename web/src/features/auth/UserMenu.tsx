import { Badge, Button, Group, Text, Tooltip } from "@mantine/core";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLogout } from "./queries";
import { useAuth } from "./use-auth";

export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <Group gap="md">
      {user?.is_demo ? (
        <Tooltip
          label="Demo data is temporary"
          events={{ hover: true, focus: true, touch: true }}
        >
          <Badge variant="light" radius="xl" tabIndex={0}>
            Demo
          </Badge>
        </Tooltip>
      ) : (
        <Text size="sm" c="dimmed">
          {user?.email}
        </Text>
      )}
      <ThemeToggle />
      <Button variant="default" size="xs" onClick={() => logout.mutate()}>
        Log out
      </Button>
    </Group>
  );
}
