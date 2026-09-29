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

type KeysMatching<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type AccountInputFieldConfig = { editable: boolean };

export type AccountInputField = keyof typeof ACCOUNT_INPUT_FIELDS;

export type AccountInput = Pick<Account, AccountInputField>;

export type EditableAccountField = KeysMatching<
  typeof ACCOUNT_INPUT_FIELDS,
  { editable: true }
>;

export type AccountUpdate = Partial<Pick<AccountInput, EditableAccountField>>;
