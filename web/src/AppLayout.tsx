import { Anchor, Container, Group } from "@mantine/core";
import { Link, NavLink, Outlet } from "react-router-dom";
import { UserMenu } from "@/features/auth/UserMenu";
import classes from "./AppLayout.module.css";

const NAV_LINKS = [
  { to: "/", label: "Accounts" },
  { to: "/transactions", label: "Transactions" },
];

export function AppLayout() {
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
            Cardcase
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
        <UserMenu />
      </Group>
      <Outlet />
    </Container>
  );
}
