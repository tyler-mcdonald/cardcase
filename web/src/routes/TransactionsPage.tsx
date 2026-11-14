import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { FirstPageRedirect } from "@/components/FirstPageRedirect";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { hasAccount } from "@/features/accounts/format";
import { allAccountsQuery } from "@/features/accounts/queries";
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
import { useTransactionFilters } from "@/features/transactions/use-transaction-filters";
import { isPastLastPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";

type NewTransactionEditor = { kind: "new"; key: number };
type EditTransactionEditor = { kind: "edit" } & EditTarget;
type Editor = NewTransactionEditor | EditTransactionEditor;

// True when the row being edited is no longer on the loaded page.
function isEditedRowGone(
  editor: Editor | null,
  transactions: { id: string }[] | undefined,
): boolean {
  return (
    editor?.kind === "edit" &&
    transactions !== undefined &&
    !transactions.some((transaction) => transaction.id === editor.id)
  );
}

export function TransactionsPage() {
  const { page, goToPage } = usePageParam();
  const { filters, setFilters } = useTransactionFilters();
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    transactionsQuery({ page, ...filters }),
  );
  const { data: accounts, isPending: isAccountsPending } =
    useQuery(allAccountsQuery());
  const filteredAccountId =
    accounts && filters.account && hasAccount(accounts, filters.account)
      ? filters.account
      : undefined;
  const isSaving = useIsSavingTransaction();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorFilter, setEditorFilter] = useState(filters.account);
  if (editorFilter !== filters.account) {
    setEditorFilter(filters.account);
    setEditor(null);
  }
  if (isEditedRowGone(editor, data?.items)) {
    setEditor(null);
  }
  const isAdding = editor?.kind === "new";
  const editTarget = editor?.kind === "edit" ? editor : null;
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

  function filterByAccount(accountId: string | null) {
    setFilters({ account: accountId ?? undefined });
  }

  function closeEditor(closing: Editor | null) {
    setEditor((current) => (current === closing ? null : current));
  }

  if (isPastLastPage(page, error)) {
    return <FirstPageRedirect />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={1} size="h2">
          Transactions
        </Title>
        <Button
          onClick={openNewTransaction}
          disabled={
            data === undefined ||
            (filters.account !== undefined && isAccountsPending) ||
            isSaving
          }
        >
          Add transaction
        </Button>
      </Group>

      <AccountSelect
        aria-label="Filter by account"
        placeholder="All accounts"
        searchable
        clearable
        clearButtonProps={{ "aria-label": "Clear account filter" }}
        showUnknownValue
        value={filters.account ?? null}
        onChange={filterByAccount}
        disabled={isSaving}
        maw={280}
      />

      {isPending && <TransactionsTableSkeleton />}

      {isError && (
        <LoadErrorAlert
          title="Couldn't load your transactions"
          error={error}
          retrying={isFetching}
          onRetry={() => refetch()}
        />
      )}

      {isEmpty && (
        <Text fw={600}>
          {filters.account
            ? "No transactions for this account"
            : "No transactions yet."}
        </Text>
      )}

      {showTable && (
        <TransactionsTable
          transactions={data.items}
          editTarget={editTarget}
          onEdit={isSaving ? undefined : openEditTransaction}
          onEditClose={() => closeEditor(editor)}
          newRow={
            isAdding && (
              <NewTransactionRow
                key={editor.key}
                accountId={filteredAccountId}
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
