import type { ACCOUNT_INPUT_FIELDS } from "./constants";

export type Account = {
  id: string;
  name: string;
  description: string;
  type: "gift_card" | "flight_credit";
  expires_on: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountInputField = (typeof ACCOUNT_INPUT_FIELDS)[number];

export type AccountInput = Pick<Account, AccountInputField>;

export type EditableAccountField = Exclude<AccountInputField, "type">;

export type AccountUpdate = Partial<Pick<AccountInput, EditableAccountField>>;
