import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { PagePagination } from "@/components/PagePagination";
import {
  AccountCard,
  AccountCardSkeleton,
} from "@/features/accounts/AccountCard";
import { CreateAccountModal } from "@/features/accounts/CreateAccountModal";
import { EditAccountModal } from "@/features/accounts/EditAccountModal";
import { accountsQuery } from "@/features/accounts/queries";
import type { Account } from "@/features/accounts/types";
import { isMissingPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";
import classes from "./AccountsPage.module.css";

export function AccountsPage() {
  const { page, goToPage } = usePageParam();
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
        <LoadErrorAlert
          title="Couldn't load your accounts"
          error={error}
          retrying={isFetching}
          onRetry={() => refetch()}
        />
      )}

      {data?.items.length === 0 && (
        <div>
          <Text fw={600}>No accounts yet.</Text>
          <Text c="dimmed" size="sm">
            Add a gift card or flight credit to start tracking it.
          </Text>
        </div>
      )}

      {data && data.items.length > 0 && (
        <Box className={classes.grid}>
          {data.items.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
            />
          ))}
        </Box>
      )}

      {data && (
        <PagePagination
          total={data.totalPages}
          page={page}
          onChange={goToPage}
        />
      )}
    </Stack>
  );
}
