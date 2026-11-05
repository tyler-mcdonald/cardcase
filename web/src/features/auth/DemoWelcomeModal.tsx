import { Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useLogout } from "./queries";
import { useAuth } from "./use-auth";

export function DemoWelcomeModal() {
  const { user } = useAuth();

  if (!user?.is_demo) {
    return null;
  }

  return <WelcomeModal key={user.id} userId={user.id} />;
}

function WelcomeModal({ userId }: { userId: string }) {
  const logout = useLogout();
  const [seen, setSeen] = useLocalStorage({
    key: `cardcase:demo-welcome-seen:${userId}`,
    defaultValue: false,
    getInitialValueInEffect: false,
  });

  const close = () => setSeen(true);

  return (
    <Modal
      opened={!seen}
      onClose={close}
      title="Welcome to the cardcase demo"
      centered
    >
      <Stack>
        <Text size="sm">
          You're signed in to a demo account with sample gift cards and flight
          credits.
        </Text>
        <List size="sm" spacing={4}>
          <List.Item>
            All the data is made up, so add, edit or delete anything.
          </List.Item>
          <List.Item>
            This account and everything in it is deleted after 24 hours.
          </List.Item>
          <List.Item>
            To use cardcase for real, sign up with your email.
          </List.Item>
        </List>
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
          >
            Sign up
          </Button>
          <Button onClick={close} data-autofocus>
            Start exploring
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
