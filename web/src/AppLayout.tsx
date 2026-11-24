import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopHeader } from "@/layout/DesktopHeader";
import { MobileHeader } from "@/layout/MobileHeader";
import { MobileTabBar } from "@/layout/MobileTabBar";

const PAGE_PADDING_TOP = {
  base: "max(8px, env(safe-area-inset-top))",
  sm: "xl",
};

const PAGE_PADDING_BOTTOM = {
  base: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom) + var(--mantine-spacing-xl))",
  sm: "xl",
};

export function AppLayout() {
  return (
    <>
      <Container pt={PAGE_PADDING_TOP} pb={PAGE_PADDING_BOTTOM}>
        <MobileHeader />
        <DesktopHeader />
        <Outlet />
      </Container>
      <MobileTabBar />
      <DemoWelcomeModal />
    </>
  );
}
