import { apiFetch } from "@/lib/api";

const ACCOUNTS_PATH = "/v1/accounts";

export type AccountType = "gift_card" | "flight_credit";

export type Account = {
  id: string;
  name: string;
  description: string;
  type: AccountType;
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
  const response = await apiFetch(ACCOUNTS_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load accounts (${response.status})`);
  }
  const page = (await response.json()) as Paginated<Account>;
  return page.results;
}
