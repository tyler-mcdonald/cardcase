import type { ReactNode } from "react";
import { Skeleton, Table } from "@mantine/core";
import { AccountDisplayName } from "@/features/accounts/AccountDisplayName";
import type { AccountLabel } from "@/features/accounts/types";
import { formatDate } from "@/lib/format";
import { COLUMN_COUNT } from "./constants";
import { EditTransactionRow } from "./EditTransactionRow";
import classes from "./TransactionsTable.module.css";
import { formatOutflowAndInflow } from "./format";
import type { TransactionField } from "./transaction-form";
import type { Transaction } from "./types";

const SKELETON_ROW_COUNT = 8;

function TransactionsTableFrame({ children }: { children: ReactNode }) {
  return (
    <Table
      highlightOnHover
      withTableBorder
      verticalSpacing="xs"
      className={classes.table}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th className={classes.date}>Date</Table.Th>
          <Table.Th className={classes.account}>Account</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th className={classes.amount}>Outflow</Table.Th>
          <Table.Th className={classes.amount}>Inflow</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{children}</Table.Tbody>
    </Table>
  );
}

export type EditTarget = { id: string; focusField: TransactionField };

function EditableCell({
  field,
  onEdit,
  className,
  children,
}: {
  field: TransactionField;
  onEdit?: (field: TransactionField) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Table.Td className={className} onClick={onEdit && (() => onEdit(field))}>
      {children}
    </Table.Td>
  );
}

function TransactionRow({
  transaction,
  accountLabel,
  onEdit,
}: {
  transaction: Transaction;
  accountLabel: AccountLabel;
  onEdit?: (target: EditTarget) => void;
}) {
  const { outflow, inflow } = formatOutflowAndInflow(transaction.amount);
  const editField =
    onEdit &&
    ((focusField: TransactionField) =>
      onEdit({ id: transaction.id, focusField }));
  return (
    <Table.Tr className={onEdit && classes.clickableRow}>
      <EditableCell field="occurredOn" onEdit={editField}>
        {formatDate(transaction.occurred_on)}
      </EditableCell>
      <EditableCell field="accountId" onEdit={editField}>
        <AccountDisplayName label={accountLabel} size="sm" />
      </EditableCell>
      <EditableCell
        field="description"
        onEdit={editField}
        className={classes.description}
      >
        {transaction.description}
      </EditableCell>
      <EditableCell
        field="outflow"
        onEdit={editField}
        className={classes.amount}
      >
        {outflow}
      </EditableCell>
      <EditableCell
        field="inflow"
        onEdit={editField}
        className={classes.amount}
      >
        {inflow}
      </EditableCell>
    </Table.Tr>
  );
}

export function TransactionsTable({
  transactions,
  accountLabel,
  newRow,
  editTarget,
  onEdit,
  onEditClose,
}: {
  transactions: Transaction[];
  accountLabel: (account: Transaction["account"]) => AccountLabel;
  newRow?: ReactNode;
  editTarget: EditTarget | null;
  onEdit?: (target: EditTarget) => void;
  onEditClose: () => void;
}) {
  return (
    <TransactionsTableFrame>
      {newRow}
      {transactions.map((transaction) => {
        const label = accountLabel(transaction.account);
        return transaction.id === editTarget?.id ? (
          <EditTransactionRow
            key={transaction.id}
            transaction={transaction}
            accountLabel={label}
            focusField={editTarget.focusField}
            onClose={onEditClose}
          />
        ) : (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            accountLabel={label}
            onEdit={onEdit}
          />
        );
      })}
    </TransactionsTableFrame>
  );
}

export function TransactionsTableSkeleton() {
  return (
    <TransactionsTableFrame>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
        <Table.Tr key={row}>
          {Array.from({ length: COLUMN_COUNT }, (_, column) => (
            <Table.Td key={column}>
              <Skeleton height={12} radius="xl" />
            </Table.Td>
          ))}
        </Table.Tr>
      ))}
    </TransactionsTableFrame>
  );
}
