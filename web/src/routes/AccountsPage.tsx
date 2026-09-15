import { useEffect, useState } from "react";
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
import { listAccounts, type Account } from "@/features/accounts/api";
import { useAuth } from "@/lib/use-auth";
import classes from "./AccountsPage.module.css";

type LoadState = "loading" | "loaded" | "error";

export function AccountsPage() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    async function load() {
      try {
        const results = await listAccounts();
        setAccounts(results);
        setState("loaded");
      } catch {
        setState("error");
      }
    }
    load();
  }, []);

  async function retry() {
    setState("loading");
    try {
      const results = await listAccounts();
      setAccounts(results);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

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
          <Button variant="default" size="xs" onClick={() => logout()}>
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

        {state === "loading" && (
          <Box className={classes.grid}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} radius="lg" className={classes.skeleton} />
            ))}
          </Box>
        )}

        {state === "error" && (
          <Alert color="red" title="Couldn't load your accounts">
            <Stack gap="sm">
              <Text size="sm">Something went wrong. Please try again.</Text>
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={retry}
                className={classes.retryButton}
              >
                Try again
              </Button>
            </Stack>
          </Alert>
        )}

        {state === "loaded" && accounts.length === 0 && (
          <Text c="dimmed">No accounts yet.</Text>
        )}

        {state === "loaded" && accounts.length > 0 && (
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
