import { AccountForm } from "./AccountForm";
import { ACCOUNT_INPUT_FIELDS, EDITABLE_ACCOUNT_FIELDS } from "./constants";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";

function toAccountInput(account: Account): AccountInput {
  return Object.fromEntries(
    ACCOUNT_INPUT_FIELDS.map((field) => [field, account[field]]),
  ) as AccountInput;
}

function changedFields(account: Account, values: AccountInput): AccountUpdate {
  return Object.fromEntries(
    EDITABLE_ACCOUNT_FIELDS.filter(
      (field) => values[field] !== account[field],
    ).map((field) => [field, values[field]]),
  );
}

export function EditAccountForm({
  account,
  onSaved,
  onCancel,
}: {
  account: Account;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const updateAccount = useUpdateAccount(account.id);

  function save(values: AccountInput) {
    const changes = changedFields(account, values);
    if (Object.keys(changes).length === 0) {
      onSaved();
      return;
    }
    updateAccount.mutate(changes, { onSuccess: onSaved });
  }

  return (
    <AccountForm
      initialValues={toAccountInput(account)}
      typeLocked
      submitLabel="Save changes"
      isPending={updateAccount.isPending}
      error={updateAccount.error}
      onSubmit={save}
      onCancel={onCancel}
    />
  );
}
