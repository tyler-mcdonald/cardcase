import {
  Group,
  Menu,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

export const MENU_ICON_SIZE = 16;

const OPTIONS: {
  value: MantineColorScheme;
  label: string;
  icon: ReactNode;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: <IconSun size={MENU_ICON_SIZE} aria-hidden />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <IconMoon size={MENU_ICON_SIZE} aria-hidden />,
  },
  {
    value: "auto",
    label: "System",
    icon: <IconDeviceDesktop size={MENU_ICON_SIZE} aria-hidden />,
  },
];

export function ThemeOptions() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu.RadioGroup
      value={colorScheme}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
    >
      {OPTIONS.map((option) => (
        <Menu.RadioItem
          key={option.value}
          value={option.value}
          checkIcon={<IconCheck size={14} aria-hidden data-icon="check" />}
          closeMenuOnClick
        >
          <Group gap="xs" wrap="nowrap">
            {option.icon}
            {option.label}
          </Group>
        </Menu.RadioItem>
      ))}
    </Menu.RadioGroup>
  );
}
