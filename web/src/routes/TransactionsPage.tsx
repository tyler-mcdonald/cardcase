import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { hasAccount } from "@/features/accounts/lookup";
import { allAccountsQuery } from "@/features/accounts/queries";
import type { Account } from "@/features/accounts/types";
import { accountLabeler } from "@/features/accounts/labels";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { Pager } from "@/components/Pager";
import { NewTransactionModal } from "@/features/transactions/NewTransactionModal";
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
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { usePageParam } from "@/lib/hooks/use-page-param";
import { usePaginatedQuery } from "@/lib/hooks/use-paginated-query";

type NewTransactionEditor = { kind: "new"; key: number; asModal: boolean };
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

function newTransactionEditor(
  editor: Editor | null,
  { asModal }: { asModal: boolean },
): NewTransactionEditor | null {
  if (editor?.kind !== "new") {
    return null;
  }
  if (editor.asModal !== asModal) {
    return null;
  }
  return editor;
}

// True when the accounts have loaded and `id` isn't one of them, e.g. a stale
// link to a deleted account.
function isUnknownAccount(
  accounts: Account[] | undefined,
  id: string | undefined,
): boolean {
  return (
    accounts !== undefined && id !== undefined && !hasAccount(accounts, id)
  );
}

// The filtered account's id, once it's confirmed to be one of the user's
// accounts; new transactions default to it.
function knownAccountId(
  accounts: Account[] | undefined,
  id: string | undefined,
): string | undefined {
  return accounts && id && hasAccount(accounts, id) ? id : undefined;
}

// A filtered page waits for accounts so the new row can default to the filter.
function canAddTransaction({
  isLoaded,
  isFiltered,
  isAccountsPending,
  isSaving,
}: {
  isLoaded: boolean;
  isFiltered: boolean;
  isAccountsPending: boolean;
  isSaving: boolean;
}): boolean {
  return isLoaded && !(isFiltered && isAccountsPending) && !isSaving;
}

function EmptyTransactions({ filtered }: { filtered: boolean }) {
  return (
    <Text fw={600}>
      {filtered ? "No transactions for this account" : "No transactions yet."}
    </Text>
  );
}

export function TransactionsPage() {
  const { page, goToPage } = usePageParam();
  const isMobile = useIsMobile();
  const { filters, setFilters } = useTransactionFilters();
  const { data, loadError, isPending, isFetching, refetch } = usePaginatedQuery(
    (page) => transactionsQuery({ page, ...filters }),
  );
  const {
    data: accounts,
    isPending: isAccountsPending,
    isSuccess: isAccountsLoaded,
    isFetching: isAccountsFetching,
  } = useQuery(allAccountsQuery());
  const accountLabel = useMemo(() => accountLabeler(accounts), [accounts]);
  const filteredAccountId = knownAccountId(accounts, filters.account);
  // Only a settled, successful fetch can rule the filter out: cached accounts
  // shown during a refetch may predate the filtered account.
  const isFilterUnknown =
    isAccountsLoaded &&
    !isAccountsFetching &&
    isUnknownAccount(accounts, filters.account);
  useEffect(() => {
    if (isFilterUnknown) {
      setFilters({ account: undefined }, { replace: true });
    }
  }, [isFilterUnknown, setFilters]);
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
  const isAddEnabled = canAddTransaction({
    isLoaded: data !== undefined,
    isFiltered: filters.account !== undefined,
    isAccountsPending,
    isSaving,
  });
  const rowEditor = newTransactionEditor(editor, { asModal: false });
  const modalEditor = newTransactionEditor(editor, { asModal: true });
  const editTarget = editor?.kind === "edit" ? editor : null;
  const isEmpty = data?.items.length === 0 && !rowEditor;
  const showTable = data !== undefined && !isEmpty;

  function openNewTransaction() {
    setEditor((current) => ({
      kind: "new",
      key: current?.kind === "new" ? current.key + 1 : 1,
      asModal: isMobile,
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

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={1} size="h2">
          Transactions
        </Title>
        <Button onClick={openNewTransaction} disabled={!isAddEnabled}>
          Add transaction
        </Button>
      </Group>

      <AccountSelect
        aria-label="Filter by account"
        placeholder="All accounts"
        searchable
        clearable
        clearButtonProps={{ "aria-label": "Clear account filter" }}
        value={filters.account ?? null}
        onChange={filterByAccount}
        disabled={isSaving}
        maw={280}
      />

      {isPending && <TransactionsTableSkeleton />}

      {loadError && (
        <LoadErrorAlert
          title="Couldn't load your transactions"
          error={loadError}
          retrying={isFetching}
          onRetry={() => refetch()}
        />
      )}

      {isEmpty && (
        <EmptyTransactions filtered={filters.account !== undefined} />
      )}

      {showTable && (
        <TransactionsTable
          transactions={data.items}
          accountLabel={accountLabel}
          editTarget={editTarget}
          onEdit={isSaving ? undefined : openEditTransaction}
          onEditClose={() => closeEditor(editor)}
          newRow={
            rowEditor && (
              <NewTransactionRow
                key={rowEditor.key}
                accountId={filteredAccountId}
                onClose={() => closeEditor(rowEditor)}
              />
            )
          }
        />
      )}

      {modalEditor && (
        <NewTransactionModal
          key={modalEditor.key}
          accountId={filteredAccountId}
          onClose={() => closeEditor(modalEditor)}
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
