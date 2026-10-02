import type { ReactNode } from "react";
import { Skeleton, Table, Text } from "@mantine/core";
import { AccountTypeBadge } from "@/features/accounts/AccountTypeBadge";
import { formatDate } from "@/lib/format";
import classes from "./TransactionsTable.module.css";
import { formatOutflowAndInflow } from "./format";
import type { Transaction } from "./types";

const COLUMN_COUNT = 6;
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

export function TransactionsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <TransactionsTableFrame>
      {transactions.map((transaction) => {
        const { outflow, inflow } = formatOutflowAndInflow(transaction.amount);
        return (
          <Table.Tr key={transaction.id}>
            <Table.Td>{formatDate(transaction.occurred_on)}</Table.Td>
            <Table.Td>
              <Text size="sm" truncate>
                {transaction.account.name}
              </Text>
            </Table.Td>
            <Table.Td>
              <AccountTypeBadge type={transaction.account.type} />
            </Table.Td>
            <Table.Td className={classes.description}>
              {transaction.description}
            </Table.Td>
            <Table.Td className={classes.amount}>{outflow}</Table.Td>
            <Table.Td className={classes.amount}>{inflow}</Table.Td>
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
