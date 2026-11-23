import { Outlet } from "react-router-dom";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { DesktopLayout } from "@/layout/DesktopLayout";
import { MobileLayout } from "@/layout/MobileLayout";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

export function AppLayout() {
  const Layout = useIsMobile() ? MobileLayout : DesktopLayout;

  return (
    <Layout>
      <Outlet />
      <DemoWelcomeModal />
    </Layout>
  );
}
