export type Account = {
  id: string;
  name: string;
  description: string;
  type: "gift_card" | "flight_credit";
  expires_on: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountInputField = "name" | "description" | "type" | "expires_on";

export type AccountInput = Pick<Account, AccountInputField>;

export type EditableAccountField = Exclude<AccountInputField, "type">;

export type AccountUpdate = Partial<Pick<AccountInput, EditableAccountField>>;
