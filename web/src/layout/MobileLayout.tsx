import type { ReactNode } from "react";
import { Container, Group, UnstyledButton } from "@mantine/core";
import { NavLink } from "react-router-dom";
import { MobileHeaderAccount } from "@/features/auth/MobileHeaderAccount";
import { BrandLink } from "./BrandLink";
import classes from "./MobileLayout.module.css";
import { NAV_LINKS } from "./nav-links";

const TAB_ICON_SIZE = 24;

export function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Container className={classes.page}>
        <Group justify="space-between" className={classes.header}>
          <BrandLink />
          <MobileHeaderAccount />
        </Group>
        {children}
      </Container>
      <nav className={classes.tabBar}>
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <UnstyledButton
            key={to}
            component={NavLink}
            to={to}
            end
            className={classes.tab}
          >
            <Icon size={TAB_ICON_SIZE} aria-hidden />
            {label}
          </UnstyledButton>
        ))}
      </nav>
    </>
  );
}
