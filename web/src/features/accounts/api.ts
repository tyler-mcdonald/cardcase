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

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function listAccounts(): Promise<Account[]> {
  const accounts: Account[] = [];
  let path: string | null = ACCOUNTS_PATH;

  while (path) {
    const page: Paginated<Account> = await request("GET", path);
    accounts.push(...page.results);
    path = page.next;
  }

  return accounts;
}
