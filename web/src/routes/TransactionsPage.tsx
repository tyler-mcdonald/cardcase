import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Stack, Text, Title } from "@mantine/core";
import { LoadErrorAlert } from "@/components/LoadErrorAlert";
import { PagePagination } from "@/components/PagePagination";
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

      {data?.items.length === 0 && <Text fw={600}>No transactions yet.</Text>}

      {data && data.items.length > 0 && (
        <TransactionsTable transactions={data.items} />
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
