import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Group,
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
import { CreateAccountModal } from "@/features/accounts/CreateAccountModal";
import { EditAccountModal } from "@/features/accounts/EditAccountModal";
import { accountsQuery } from "@/features/accounts/queries";
import type { Account } from "@/features/accounts/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { isMissingPage, parsePage } from "@/lib/api/pagination";
import classes from "./AccountsPage.module.css";

export function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    accountsQuery(page),
  );
  const [createOpened, createModal] = useDisclosure(false);
  const [editOpened, editModal] = useDisclosure(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  function openEdit(account: Account) {
    setEditingAccount(account);
    editModal.open();
  }

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

      <CreateAccountModal
        opened={createOpened}
        onCreated={handleCreated}
        onClose={createModal.close}
      />

      <EditAccountModal
        account={editingAccount}
        opened={editOpened}
        onClose={editModal.close}
      />

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
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
            />
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
