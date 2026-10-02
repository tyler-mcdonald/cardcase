import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { Pager } from "@/components/Pager";
import { NewTransactionRow } from "@/features/transactions/NewTransactionRow";
import {
  TransactionsTable,
  TransactionsTableSkeleton,
} from "@/features/transactions/TransactionsTable";
import {
  transactionsQuery,
  useIsSavingTransaction,
} from "@/features/transactions/queries";
import { isMissingPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";

export function TransactionsPage() {
  const { page, goToPage } = usePageParam();
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    transactionsQuery(page),
  );
  const isSaving = useIsSavingTransaction();
  const [editorKey, setEditorKey] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isAdding = editorKey !== null;
  const isEmpty = data?.items.length === 0 && !isAdding;
  const showTable = data !== undefined && !isEmpty;

  function openNewTransaction() {
    setEditingId(null);
    setEditorKey((key) => (key ?? 0) + 1);
  }

  function openEditTransaction(id: string) {
    setEditorKey(null);
    setEditingId(id);
  }

  if (page > 1 && isMissingPage(error)) {
    return <Navigate to={{ search: "" }} replace />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={1} size="h2">
          Transactions
        </Title>
        <Button
          onClick={openNewTransaction}
          disabled={data === undefined || isSaving}
        >
          Add transaction
        </Button>
      </Group>

      {isPending && <TransactionsTableSkeleton />}

      {isError && (
        <LoadErrorAlert
          title="Couldn't load your transactions"
          error={error}
          retrying={isFetching}
          onRetry={() => refetch()}
        />
      )}

      {isEmpty && <Text fw={600}>No transactions yet.</Text>}

      {showTable && (
        <TransactionsTable
          transactions={data.items}
          editingId={editingId}
          onEdit={isSaving ? undefined : openEditTransaction}
          onEditClose={() => setEditingId(null)}
          newRow={
            isAdding && (
              <NewTransactionRow
                key={editorKey}
                onClose={() => setEditorKey(null)}
              />
            )
          }
        />
      )}

      {data && (
        <Pager total={data.totalPages} page={page} onChange={goToPage} />
      )}
    </Stack>
  );
}
