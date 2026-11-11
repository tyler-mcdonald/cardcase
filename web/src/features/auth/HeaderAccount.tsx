import { Badge, Group, Text, Tooltip } from "@mantine/core";
import { useAuth } from "./use-auth";
import { UserMenu } from "./UserMenu";

export function HeaderAccount() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const isDemo = user?.is_demo ?? false;

  return (
    <Group gap="sm">
      {isDemo ? (
        <DemoBadge />
      ) : (
        <Text size="sm" c="dimmed">
          {email}
        </Text>
      )}
      <UserMenu email={email} isDemo={isDemo} />
    </Group>
  );
}

function DemoBadge() {
  return (
    <Tooltip
      label="Demo data is temporary"
      events={{ hover: true, focus: true, touch: true }}
    >
      <Badge variant="light" color="gray" radius="xl" tabIndex={0}>
        Demo
      </Badge>
    </Tooltip>
  );
}
