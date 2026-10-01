import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Pagination, Stack, Text, Title } from "@mantine/core";
import {
  TransactionsTable,
  TransactionsTableSkeleton,
} from "@/features/transactions/TransactionsTable";
import { transactionsQuery } from "@/features/transactions/queries";
import { apiErrorMessage } from "@/lib/api/errors";
import { isMissingPage, parsePage } from "@/lib/api/pagination";
import classes from "./TransactionsPage.module.css";

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    transactionsQuery(page),
  );

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    window.scrollTo({ top: 0 });
  }

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
        <Alert color="red" title="Couldn't load your transactions">
          <Stack gap="sm">
            <Text size="sm">{apiErrorMessage(error)}</Text>
            <Button
              variant="light"
              color="red"
              size="xs"
              loading={isFetching}
              onClick={() => refetch()}
              className={classes.retryButton}
            >
              Try again
            </Button>
          </Stack>
        </Alert>
      )}

      {data?.transactions.length === 0 && (
        <Text fw={600}>No transactions yet.</Text>
      )}

      {data && data.transactions.length > 0 && (
        <TransactionsTable transactions={data.transactions} />
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          total={data.totalPages}
          value={page}
          onChange={goToPage}
          className={classes.pagination}
        />
      )}
    </Stack>
  );
}
