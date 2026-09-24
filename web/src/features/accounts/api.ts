import { request } from "@/lib/api";

const ACCOUNTS_PATH = "/v1/accounts";

export type Account = {
  id: string;
  name: string;
  description: string;
  type: "gift_card" | "flight_credit";
  expires_on: string | null;
  created_at: string;
  updated_at: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function listAccounts(page: number) {
  const query = new URLSearchParams({ page: String(page) });
  return request<Paginated<Account>>("GET", `${ACCOUNTS_PATH}?${query}`);
}
