export type Account = {
  id: string;
  name: string;
  description: string;
  type: "gift_card" | "flight_credit";
  expires_on: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountInput = Pick<
  Account,
  "name" | "description" | "type" | "expires_on"
>;

export type AccountUpdate = Partial<Omit<AccountInput, "type">>;
