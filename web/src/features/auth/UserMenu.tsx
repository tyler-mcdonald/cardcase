import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { MENU_ICON_SIZE, ThemeOptions } from "@/components/ThemeOptions";
import { useLogout } from "./queries";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  const logout = useLogout();

  return (
    <Menu position="bottom-end" width={220}>
      <Menu.Target>
        <UnstyledButton aria-label="Account menu">
          <Avatar radius="xl" size={30}>
            {email.charAt(0).toUpperCase()}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label style={{ overflowWrap: "anywhere" }}>{email}</Menu.Label>
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
  );
}
