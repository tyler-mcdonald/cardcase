import { AccountForm } from "./AccountForm";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput } from "./types";

function toAccountInput({
  name,
  type,
  expires_on,
  description,
}: Account): AccountInput {
  return { name, type, expires_on, description };
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
  const updateAccount = useUpdateAccount({ onSuccess: onSaved });

  return (
    <AccountForm
      initialValues={toAccountInput(account)}
      submitLabel="Save changes"
      isPending={updateAccount.isPending}
      error={updateAccount.error}
      onSubmit={(input) => updateAccount.mutate({ id: account.id, input })}
      onCancel={onCancel}
    />
  );
}
