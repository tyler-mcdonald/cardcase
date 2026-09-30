import { AccountForm } from "./AccountForm";
import { AccountFormModal } from "./AccountFormModal";
import { useCreateAccount } from "./queries";
import type { AccountInput } from "./types";

const INITIAL_VALUES: AccountInput = {
  name: "",
  type: "gift_card",
  expires_on: null,
  description: "",
};

export function CreateAccountModal({
  opened,
  onCreated,
  onClose,
}: {
  opened: boolean;
  onCreated: () => void;
  onClose: () => void;
}) {
  const createAccount = useCreateAccount();

  return (
    <AccountFormModal
      title="Add account"
      opened={opened}
      onClose={onClose}
      mutation={createAccount}
    >
      {(close) => (
        <AccountForm
          initialValues={INITIAL_VALUES}
          submitLabel="Add account"
          isPending={createAccount.isPending}
          error={createAccount.error}
          onSubmit={(values) =>
            createAccount.mutate(values, { onSuccess: onCreated })
          }
          onCancel={close}
        />
      )}
    </AccountFormModal>
  );
}
