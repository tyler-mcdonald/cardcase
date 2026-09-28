import { useState } from "react";
import { AccountForm } from "./AccountForm";
import { EDITABLE_ACCOUNT_FIELDS } from "./constants";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";

function toAccountInput({
  name,
  type,
  expires_on,
  description,
}: Account): AccountInput {
  return { name, type, expires_on, description };
}

function changedFields(
  initialValues: AccountInput,
  values: AccountInput,
): AccountUpdate {
  return Object.fromEntries(
    EDITABLE_ACCOUNT_FIELDS.filter(
      (field) => values[field] !== initialValues[field],
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
  const [initialValues] = useState(() => toAccountInput(account));

  function save(values: AccountInput) {
    const changes = changedFields(initialValues, values);
    if (Object.keys(changes).length === 0) {
      onSaved();
      return;
    }
    updateAccount.mutate(changes, { onSuccess: onSaved });
  }

  return (
    <AccountForm
      initialValues={initialValues}
      typeLocked
      submitLabel="Save changes"
      isPending={updateAccount.isPending}
      error={updateAccount.error}
      onSubmit={save}
      onCancel={onCancel}
    />
  );
}
