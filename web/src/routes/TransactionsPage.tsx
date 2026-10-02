import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { Pager } from "@/components/Pager";
import { NewTransactionRow } from "@/features/transactions/NewTransactionRow";
import {
  type EditTarget,
  TransactionsTable,
  TransactionsTableSkeleton,
} from "@/features/transactions/TransactionsTable";
import {
  transactionsQuery,
  useIsSavingTransaction,
} from "@/features/transactions/queries";
import { isMissingPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";

type Editor = { kind: "new"; key: number } | ({ kind: "edit" } & EditTarget);

export function TransactionsPage() {
  const { page, goToPage } = usePageParam();
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    transactionsQuery(page),
  );
  const isSaving = useIsSavingTransaction();
  const [editor, setEditor] = useState<Editor | null>(null);
  const isEditedRowGone =
    editor?.kind === "edit" &&
    data !== undefined &&
    !data.items.some((transaction) => transaction.id === editor.id);
  if (isEditedRowGone) {
    setEditor(null);
  }
  const isAdding = editor?.kind === "new";
  const editing = editor?.kind === "edit" ? editor : null;
  const isEmpty = data?.items.length === 0 && !isAdding;
  const showTable = data !== undefined && !isEmpty;

  function openNewTransaction() {
    setEditor((current) => ({
      kind: "new",
      key: current?.kind === "new" ? current.key + 1 : 1,
    }));
  }

  function openEditTransaction(target: EditTarget) {
    setEditor({ kind: "edit", ...target });
  }

  function closeEditor(closing: Editor | null) {
    setEditor((current) => (current === closing ? null : current));
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
          editing={editing}
          onEdit={isSaving ? undefined : openEditTransaction}
          onEditClose={() => closeEditor(editor)}
          newRow={
            isAdding && (
              <NewTransactionRow
                key={editor.key}
                onClose={() => closeEditor(editor)}
              />
            )
          }
        />
      )}

      {data && (
        <Pager
          total={data.totalPages}
          page={page}
          onChange={goToPage}
          disabled={isSaving}
        />
      )}
    </Stack>
  );
}
