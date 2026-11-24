import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopHeader } from "@/layout/DesktopHeader";
import classes from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <Container className={classes.page}>
      <DesktopHeader />
      <Outlet />
      <DemoWelcomeModal />
    </Container>
  );
}
