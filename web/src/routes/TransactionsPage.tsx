import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Stack, Text, Title } from "@mantine/core";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { hasAccount } from "@/features/accounts/lookup";
import { allAccountsQuery } from "@/features/accounts/queries";
import type { Account } from "@/features/accounts/types";
import { accountLabeler } from "@/features/accounts/labels";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { Pager } from "@/components/Pager";
import { EditTransactionModal } from "@/features/transactions/EditTransactionModal";
import { NewTransactionModal } from "@/features/transactions/NewTransactionModal";
import { NewTransactionRow } from "@/features/transactions/NewTransactionRow";
import {
  TransactionsList,
  TransactionsListSkeleton,
} from "@/features/transactions/TransactionsList";
import {
  type EditTarget,
  TransactionsTable,
  TransactionsTableSkeleton,
} from "@/features/transactions/TransactionsTable";
import {
  transactionsQuery,
  useIsSavingTransaction,
} from "@/features/transactions/queries";
import type {
  AccountLabelFor,
  Transaction,
} from "@/features/transactions/types";
import { useTransactionFilters } from "@/features/transactions/use-transaction-filters";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { usePageParam } from "@/lib/hooks/use-page-param";
import { usePaginatedQuery } from "@/lib/hooks/use-paginated-query";
import classes from "./TransactionsPage.module.css";

type NewTransactionEditor = { kind: "new"; key: number; inModal: boolean };
type EditTransactionRowEditor = { kind: "edit"; inModal: false } & EditTarget;
type EditTransactionModalEditor = { kind: "edit"; inModal: true; id: string };
type Editor =
  NewTransactionEditor | EditTransactionRowEditor | EditTransactionModalEditor;

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

function modalEditedTransaction(
  editor: Editor | null,
  transactions: Transaction[] | undefined,
): Transaction | undefined {
  if (editor?.kind !== "edit" || !editor.inModal) {
    return undefined;
  }
  return transactions?.find((transaction) => transaction.id === editor.id);
}

function EmptyTransactions({ filtered }: { filtered: boolean }) {
  return (
    <Text fw={600}>
      {filtered ? "No transactions for this account" : "No transactions yet."}
    </Text>
  );
}

function DesktopTransactions({
  isPending,
  transactions,
  accountLabel,
  editor,
  filteredAccountId,
  onEdit,
  onEditorClose,
}: {
  isPending: boolean;
  transactions: Transaction[] | undefined;
  accountLabel: AccountLabelFor;
  editor: Editor | null;
  filteredAccountId: string | undefined;
  onEdit?: (target: EditTarget) => void;
  onEditorClose: () => void;
}) {
  if (isPending) {
    return <TransactionsTableSkeleton />;
  }
  if (!transactions) {
    return null;
  }
  return (
    <TransactionsTable
      transactions={transactions}
      accountLabel={accountLabel}
      editTarget={editor?.kind === "edit" && !editor.inModal ? editor : null}
      onEdit={onEdit}
      onEditClose={onEditorClose}
      newRow={
        editor?.kind === "new" &&
        !editor.inModal && (
          <NewTransactionRow
            key={editor.key}
            accountId={filteredAccountId}
            onClose={onEditorClose}
          />
        )
      }
    />
  );
}

function MobileTransactions({
  isPending,
  transactions,
  accountLabel,
  onSelect,
}: {
  isPending: boolean;
  transactions: Transaction[] | undefined;
  accountLabel: AccountLabelFor;
  onSelect: (transaction: Transaction) => void;
}) {
  if (isPending) {
    return <TransactionsListSkeleton />;
  }
  if (!transactions) {
    return null;
  }
  return (
    <TransactionsList
      transactions={transactions}
      accountLabel={accountLabel}
      onSelect={onSelect}
    />
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
  if (isMobile && editor !== null && !editor.inModal) {
    setEditor(null);
  }
  const isAddEnabled = canAddTransaction({
    isLoaded: data !== undefined,
    isFiltered: filters.account !== undefined,
    isAccountsPending,
    isSaving,
  });
  const isAddingInRow = editor?.kind === "new" && !editor.inModal;
  const isAddingInModal = editor?.kind === "new" && editor.inModal;
  const editedTransaction = modalEditedTransaction(editor, data?.items);
  const isEmpty = data?.items.length === 0 && !isAddingInRow;
  const transactions = isEmpty ? undefined : data?.items;

  function openNewTransaction() {
    setEditor((current) => ({
      kind: "new",
      key: current?.kind === "new" ? current.key + 1 : 1,
      inModal: isMobile,
    }));
  }

  function openEditTransactionRow(target: EditTarget) {
    setEditor({ kind: "edit", inModal: false, ...target });
  }

  function openEditTransactionModal(transaction: Transaction) {
    if (!isSaving) {
      setEditor({ kind: "edit", inModal: true, id: transaction.id });
    }
  }

  function filterByAccount(accountId: string | null) {
    setFilters({ account: accountId ?? undefined });
  }

  function closeEditor(closing: Editor | null) {
    setEditor((current) => (current === closing ? null : current));
  }

  return (
    <Stack gap="lg">
      <div className={classes.toolbar}>
        <Title order={1} size="h2" className={classes.title}>
          Transactions
        </Title>
        <Button
          onClick={openNewTransaction}
          disabled={!isAddEnabled}
          className={classes.add}
          h={{ base: 44, sm: "var(--button-height)" }}
        >
          Add transaction
        </Button>
        <AccountSelect
          aria-label="Filter by account"
          placeholder="All accounts"
          searchable
          clearable
          clearButtonProps={{ "aria-label": "Clear account filter" }}
          value={filters.account ?? null}
          onChange={filterByAccount}
          disabled={isSaving}
          className={classes.filter}
          maw={{ sm: 280 }}
        />
      </div>

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

      {isMobile ? (
        <MobileTransactions
          isPending={isPending}
          transactions={transactions}
          accountLabel={accountLabel}
          onSelect={openEditTransactionModal}
        />
      ) : (
        <DesktopTransactions
          isPending={isPending}
          transactions={transactions}
          accountLabel={accountLabel}
          editor={editor}
          filteredAccountId={filteredAccountId}
          onEdit={isSaving ? undefined : openEditTransactionRow}
          onEditorClose={() => closeEditor(editor)}
        />
      )}

      {isAddingInModal && (
        <NewTransactionModal
          key={editor.key}
          accountId={filteredAccountId}
          onClose={() => closeEditor(editor)}
        />
      )}

      {editedTransaction && (
        <EditTransactionModal
          key={editedTransaction.id}
          transaction={editedTransaction}
          accountLabel={accountLabel(editedTransaction.account)}
          onClose={() => closeEditor(editor)}
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
