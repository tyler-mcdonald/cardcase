import { Container } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopHeader } from "@/layout/DesktopHeader";
import desktopClasses from "@/layout/DesktopLayout.module.css";
import { MobileHeader } from "@/layout/MobileHeader";
import mobileClasses from "@/layout/MobileLayout.module.css";
import { MobileTabBar } from "@/layout/MobileTabBar";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <>
      <Container
        className={isMobile ? mobileClasses.page : desktopClasses.page}
      >
        {isMobile ? <MobileHeader /> : <DesktopHeader />}
        <Outlet />
      </Container>
      {isMobile && <MobileTabBar />}
      <DemoWelcomeModal />
    </>
  );
}
