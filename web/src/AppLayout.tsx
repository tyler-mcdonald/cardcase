import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopHeader } from "@/layout/DesktopHeader";

export function AppLayout() {
  return (
    <Container pt={{ base: 8, sm: "xl" }} pb="xl">
      <DesktopHeader />
      <Outlet />
      <DemoWelcomeModal />
    </Container>
  );
}
