import type { ReactNode } from "react";
import { Anchor, Container, Group } from "@mantine/core";
import { Link, NavLink, Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { HeaderAccount } from "@/features/auth/HeaderAccount";
import { APP_NAME } from "@/lib/constants";
import classes from "./AppLayout.module.css";

const NAV_LINKS = [
  { to: "/", label: "Accounts" },
  { to: "/transactions", label: "Transactions" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Container py="xl">
      <Group justify="space-between" mb="xl">
        <Group gap="xl">
          <Anchor
            component={Link}
            to="/"
            fw={700}
            size="lg"
            c="inherit"
            underline="never"
          >
            {APP_NAME}
          </Anchor>
          <Group component="nav" gap="md">
            {NAV_LINKS.map(({ to, label }) => (
              <Anchor
                key={to}
                component={NavLink}
                to={to}
                end
                size="sm"
                underline="never"
                className={classes.navLink}
              >
                {label}
              </Anchor>
            ))}
          </Group>
        </Group>
        <HeaderAccount />
      </Group>
      {children}
      <DemoWelcomeModal />
    </Container>
  );
}

export function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
