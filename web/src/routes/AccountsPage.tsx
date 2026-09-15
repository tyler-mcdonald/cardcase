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

type LoadState = "loading" | "loaded" | "error";

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 260px))",
  gap: "var(--mantine-spacing-md)",
} as const;

export function AccountsPage() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  async function load() {
    setState("loading");
    try {
      const results = await listAccounts();
      setAccounts(results);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

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
          <Box style={GRID_STYLE}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                radius="lg"
                style={{ aspectRatio: "1.65 / 1" }}
              />
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
                onClick={load}
                style={{ alignSelf: "flex-start" }}
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
          <Box style={GRID_STYLE}>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
