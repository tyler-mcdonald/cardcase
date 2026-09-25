import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Pagination,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  AccountCard,
  AccountCardSkeleton,
} from "@/features/accounts/AccountCard";
import { CreateAccountForm } from "@/features/accounts/CreateAccountForm";
import {
  accountsQuery,
  isMissingPage,
  useIsCreatingAccount,
} from "@/features/accounts/queries";
import { apiErrorMessage } from "@/lib/api/errors";
import classes from "./AccountsPage.module.css";

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    accountsQuery(page),
  );
  const [createOpened, createModal] = useDisclosure(false);
  const creatingAccount = useIsCreatingAccount();

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    window.scrollTo({ top: 0 });
  }

  function handleCreated() {
    createModal.close();
    if (page !== 1) {
      goToPage(1);
    }
  }

  if (page > 1 && isMissingPage(error)) {
    return <Navigate to={{ search: "" }} replace />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1} size="h2">
            Accounts
          </Title>
          <Text c="dimmed" size="sm">
            Gift cards and flight credits you're tracking.
          </Text>
        </div>
        <Button onClick={createModal.open}>Add account</Button>
      </Group>

      <Modal
        opened={createOpened}
        onClose={creatingAccount ? () => {} : createModal.close}
        title="Add account"
      >
        <CreateAccountForm
          onCreated={handleCreated}
          onCancel={createModal.close}
        />
      </Modal>

      {isPending && (
        <Box className={classes.grid}>
          {Array.from({ length: 4 }, (_, index) => (
            <AccountCardSkeleton key={index} />
          ))}
        </Box>
      )}

      {isError && (
        <Alert color="red" title="Couldn't load your accounts">
          <Stack gap="sm">
            <Text size="sm">{apiErrorMessage(error)}</Text>
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

      {data?.accounts.length === 0 && (
        <div>
          <Text fw={600}>No accounts yet.</Text>
          <Text c="dimmed" size="sm">
            Add a gift card or flight credit to start tracking it.
          </Text>
        </div>
      )}

      {data && data.accounts.length > 0 && (
        <Box className={classes.grid}>
          {data.accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </Box>
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          total={data.totalPages}
          value={page}
          onChange={goToPage}
          className={classes.pagination}
        />
      )}
    </Stack>
  );
}
