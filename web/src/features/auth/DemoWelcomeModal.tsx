import { Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { FormError } from "@/components/FormError";
import { apiErrorMessage } from "@/lib/api/errors";
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
      title="Welcome to the cardcase demo 👋"
      centered
    >
      <Stack>
        <Text size="sm">
          You're signed in to a demo account with sample gift cards and flight
          credits.
        </Text>
        <List size="sm" spacing={4}>
          <List.Item>
            All the data is made up and isolated to this session, so feel free
            to add, edit, or delete whatever you want.
          </List.Item>
          <List.Item>
            This is a temporary account, so nothing here is kept.
          </List.Item>
          <List.Item>Sign up to use cardcase with your own data.</List.Item>
        </List>
        {logout.error && <FormError message={apiErrorMessage(logout.error)} />}
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
