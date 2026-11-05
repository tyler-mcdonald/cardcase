import {
  Avatar,
  Badge,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { MENU_ICON_SIZE, ThemeOptions } from "@/components/ThemeOptions";
import { useLogout } from "./queries";
import { useAuth } from "./use-auth";

export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();
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
      <Menu position="bottom-end" width={220}>
        <Menu.Target>
          <UnstyledButton aria-label="Account menu">
            <Avatar radius="xl" size={30} color="blue">
              {email.charAt(0).toUpperCase()}
            </Avatar>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {!isDemo && (
            <Menu.Label style={{ overflowWrap: "anywhere" }}>
              {email}
            </Menu.Label>
          )}
          <Menu.Item
            component={Link}
            to="/settings"
            leftSection={<IconSettings size={MENU_ICON_SIZE} aria-hidden />}
          >
            Settings
          </Menu.Item>
          <Menu.Divider />
          <Menu.Label>Theme</Menu.Label>
          <ThemeOptions />
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconLogout size={MENU_ICON_SIZE} aria-hidden />}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

function DemoBadge() {
  return (
    <Tooltip
      label="Demo data is temporary"
      events={{ hover: true, focus: true, touch: true }}
    >
      <Badge variant="light" radius="xl" tabIndex={0}>
        Demo
      </Badge>
    </Tooltip>
  );
}
