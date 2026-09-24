import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AccountCard } from "@/features/accounts/AccountCard";
import { accountsQuery } from "@/features/accounts/queries";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import classes from "./AccountsPage.module.css";

export function AccountsPage() {
  const { user } = useAuth();
  const logout = useLogout();
  const {
    data: accounts,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(accountsQuery());

  return (
    <Container py="xl">
      <Group justify="space-between" mb="xl">
        <Text fw={700} size="lg">
          Cardcase
        </Text>
        <Group gap="md">
          <Text size="sm" c="dimmed">
            {user?.email}
          </Text>
          <Button variant="default" size="xs" onClick={() => logout.mutate()}>
            Log out
          </Button>
        </Group>
      </Group>

      <Stack gap="lg">
        <div>
          <Title order={1} size="h2">
            Accounts
          </Title>
          <Text c="dimmed" size="sm">
            Gift cards and flight credits you're tracking.
          </Text>
        </div>

        {isPending && (
          <Box className={classes.grid}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} radius="lg" className={classes.skeleton} />
            ))}
          </Box>
        )}

        {isError && (
          <Alert color="red" title="Couldn't load your accounts">
            <Stack gap="sm">
              <Text size="sm">Something went wrong. Please try again.</Text>
              <Button
                variant="light"
                color="red"
                size="xs"
                loading={isFetching}
                onClick={() => refetch()}
                className={classes.retryButton}
              >
                Try again
              </Button>
            </Stack>
          </Alert>
        )}

        {accounts?.length === 0 && <Text c="dimmed">No accounts yet.</Text>}

        {accounts && accounts.length > 0 && (
          <Box className={classes.grid}>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
