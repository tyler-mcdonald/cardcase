import type { ReactNode } from "react";
import { Skeleton, Table, Text } from "@mantine/core";
import { AccountTypeBadge } from "@/features/accounts/AccountTypeBadge";
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
          <Table.Th className={classes.accountType}>Type</Table.Th>
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

export function TransactionsTable({
  transactions,
  newRow,
  editing,
  onEdit,
  onEditClose,
}: {
  transactions: Transaction[];
  newRow?: ReactNode;
  editing: EditTarget | null;
  onEdit?: (target: EditTarget) => void;
  onEditClose: () => void;
}) {
  return (
    <TransactionsTableFrame>
      {newRow}
      {transactions.map((transaction) => {
        if (transaction.id === editing?.id) {
          return (
            <EditTransactionRow
              key={transaction.id}
              transaction={transaction}
              focusField={editing.focusField}
              onClose={onEditClose}
            />
          );
        }
        const { outflow, inflow } = formatOutflowAndInflow(transaction.amount);
        const editOnClick = (focusField: TransactionField) =>
          onEdit && (() => onEdit({ id: transaction.id, focusField }));
        return (
          <Table.Tr
            key={transaction.id}
            className={onEdit && classes.clickableRow}
          >
            <Table.Td onClick={editOnClick("occurredOn")}>
              {formatDate(transaction.occurred_on)}
            </Table.Td>
            <Table.Td onClick={editOnClick("accountId")}>
              <Text size="sm" truncate>
                {transaction.account.name}
              </Text>
            </Table.Td>
            <Table.Td onClick={editOnClick("accountId")}>
              <AccountTypeBadge type={transaction.account.type} />
            </Table.Td>
            <Table.Td
              className={classes.description}
              onClick={editOnClick("description")}
            >
              {transaction.description}
            </Table.Td>
            <Table.Td
              className={classes.amount}
              onClick={editOnClick("outflow")}
            >
              {outflow}
            </Table.Td>
            <Table.Td
              className={classes.amount}
              onClick={editOnClick("inflow")}
            >
              {inflow}
            </Table.Td>
          </Table.Tr>
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
