import { AccountForm } from "./AccountForm";
import { AccountFormModal } from "./AccountFormModal";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";

const EDITABLE_FIELDS = [
  "name",
  "expires_on",
  "description",
] as const satisfies readonly (keyof AccountUpdate)[];

function editedFields(account: Account, values: AccountInput): AccountUpdate {
  const edited = EDITABLE_FIELDS.filter(
    (field) => values[field] !== account[field],
  );
  return Object.fromEntries(edited.map((field) => [field, values[field]]));
}

export function EditAccountModal({
  account,
  opened,
  onClose,
}: {
  account: Account | null;
  opened: boolean;
  onClose: () => void;
}) {
  const updateAccount = useUpdateAccount();

  function save(account: Account, values: AccountInput, close: () => void) {
    const changes = editedFields(account, values);
    if (Object.keys(changes).length === 0) {
      close();
      return;
    }
    updateAccount.mutate({ id: account.id, changes }, { onSuccess: onClose });
  }

  return (
    <AccountFormModal
      title="Edit account"
      opened={opened}
      onClose={onClose}
      mutation={updateAccount}
    >
      {(close) =>
        account && (
          <AccountForm
            key={account.id}
            initialValues={account}
            typeLocked
            submitLabel="Save changes"
            isPending={updateAccount.isPending}
            error={updateAccount.error}
            onSubmit={(values) => save(account, values, close)}
            onCancel={close}
          />
        )
      }
    </AccountFormModal>
  );
}
