import {
  ActionIcon,
  Group,
  Menu,
  useComputedColorScheme,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import type { ReactNode } from "react";

function SunIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      data-icon="sun"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon="moon"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon="check"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

const OPTIONS: {
  value: MantineColorScheme;
  label: string;
  icon: ReactNode;
}[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "auto", label: "System", icon: <MonitorIcon /> },
];

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: false,
  });

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default" size={30} aria-label="Color scheme">
          {computedColorScheme === "dark" ? <MoonIcon /> : <SunIcon />}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Theme</Menu.Label>
        <Menu.RadioGroup
          value={colorScheme}
          onChange={(value) => setColorScheme(value as MantineColorScheme)}
        >
          {OPTIONS.map((option) => (
            <Menu.RadioItem
              key={option.value}
              value={option.value}
              checkIcon={<CheckIcon />}
              closeMenuOnClick
            >
              <Group gap="xs" wrap="nowrap">
                {option.icon}
                {option.label}
              </Group>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Dropdown>
    </Menu>
  );
}
