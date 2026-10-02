import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Stack, Text, Title } from "@mantine/core";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { Pager } from "@/components/Pager";
import {
  TransactionsTable,
  TransactionsTableSkeleton,
} from "@/features/transactions/TransactionsTable";
import { transactionsQuery } from "@/features/transactions/queries";
import { isMissingPage } from "@/lib/api/pagination";
import { usePageParam } from "@/lib/hooks/use-page-param";

export function TransactionsPage() {
  const { page, goToPage } = usePageParam();
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    transactionsQuery(page),
  );
  const isEmpty = data?.items.length === 0;
  const hasTransactions = data !== undefined && data.items.length > 0;

  if (page > 1 && isMissingPage(error)) {
    return <Navigate to={{ search: "" }} replace />;
  }

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Transactions
      </Title>

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

      {hasTransactions && <TransactionsTable transactions={data.items} />}

      {data && (
        <Pager total={data.totalPages} page={page} onChange={goToPage} />
      )}
    </Stack>
  );
}
