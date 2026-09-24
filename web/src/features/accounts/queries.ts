import { queryOptions } from "@tanstack/react-query";
import { listAccounts } from "./api";

export function accountsQuery() {
  return queryOptions({
    queryKey: ["accounts"],
    queryFn: listAccounts,
  });
}
