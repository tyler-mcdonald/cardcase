import { Anchor, Container, Group } from "@mantine/core";
import { Link, Outlet } from "react-router-dom";
import { UserMenu } from "@/features/auth/UserMenu";

export function AppLayout() {
  return (
    <Container py="xl">
      <Group justify="space-between" mb="xl">
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
        <UserMenu />
      </Group>
      <Outlet />
    </Container>
  );
}
