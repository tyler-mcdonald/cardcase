import type { ReactNode } from "react";
import { Anchor, Container, Group } from "@mantine/core";
import { NavLink } from "react-router-dom";
import { HeaderAccount } from "@/features/auth/HeaderAccount";
import { BrandLink } from "./BrandLink";
import classes from "./DesktopLayout.module.css";
import { NAV_LINKS } from "./nav-links";

export function DesktopLayout({ children }: { children: ReactNode }) {
  return (
    <Container className={classes.page}>
      <Group justify="space-between" className={classes.header}>
        <Group gap="xl">
          <BrandLink />
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
    </Container>
  );
}
