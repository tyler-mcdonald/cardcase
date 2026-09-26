import { AccountForm } from "./AccountForm";
import { useCreateAccount } from "./queries";
import type { AccountInput } from "./types";

const INITIAL_VALUES: AccountInput = {
  name: "",
  type: "gift_card",
  expires_on: null,
  description: "",
};

export function CreateAccountForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const createAccount = useCreateAccount();

  return (
    <AccountForm
      initialValues={INITIAL_VALUES}
      submitLabel="Add account"
      isPending={createAccount.isPending}
      error={createAccount.error}
      onSubmit={(values) =>
        createAccount.mutate(values, { onSuccess: onCreated })
      }
      onCancel={onCancel}
    />
  );
}
