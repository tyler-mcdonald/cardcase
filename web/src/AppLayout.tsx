import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopHeader } from "@/layout/DesktopHeader";
import { MobileHeader } from "@/layout/MobileHeader";
import { MobileTabBar } from "@/layout/MobileTabBar";
import classes from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <>
      <Container className={classes.page}>
        <MobileHeader />
        <DesktopHeader />
        <Outlet />
      </Container>
      <MobileTabBar />
      <DemoWelcomeModal />
    </>
  );
}
