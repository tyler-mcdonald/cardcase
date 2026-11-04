import {
  ActionIcon,
  Group,
  Menu,
  useComputedColorScheme,
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

const ICON_SIZE = 16;

const sunIcon = <IconSun size={ICON_SIZE} aria-hidden data-icon="sun" />;
const moonIcon = <IconMoon size={ICON_SIZE} aria-hidden data-icon="moon" />;
const desktopIcon = <IconDeviceDesktop size={ICON_SIZE} aria-hidden />;

const OPTIONS: {
  value: MantineColorScheme;
  label: string;
  icon: ReactNode;
}[] = [
  { value: "light", label: "Light", icon: sunIcon },
  { value: "dark", label: "Dark", icon: moonIcon },
  { value: "auto", label: "System", icon: desktopIcon },
];

function ThemeOptions() {
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

export function ThemeToggle() {
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: false,
  });

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default" size={30} aria-label="Color scheme">
          {computedColorScheme === "dark" ? moonIcon : sunIcon}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Theme</Menu.Label>
        <ThemeOptions />
      </Menu.Dropdown>
    </Menu>
  );
}
