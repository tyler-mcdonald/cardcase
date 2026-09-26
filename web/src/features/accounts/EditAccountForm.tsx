import { AccountForm } from "./AccountForm";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";

const EDITABLE_FIELDS = ["name", "expires_on", "description"] as const;

function toAccountInput({
  name,
  type,
  expires_on,
  description,
}: Account): AccountInput {
  return { name, type, expires_on, description };
}

function changedFields(account: Account, values: AccountInput): AccountUpdate {
  return Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => values[field] !== account[field]).map(
      (field) => [field, values[field]],
    ),
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
