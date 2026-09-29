import { Modal } from "@mantine/core";
import { useState } from "react";
import { AccountForm } from "./AccountForm";
import { EDITABLE_ACCOUNT_FIELDS } from "./constants";
import { useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";

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

export function EditAccountModal({
  account,
  opened,
  onClose,
}: {
  account: Account | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [wasOpened, setWasOpened] = useState(opened);
  const [openCount, setOpenCount] = useState(0);
  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setOpenCount((count) => count + 1);
    }
  }
  const updateAccount = useUpdateAccount();
  const errors = useAccountFormErrors(updateAccount.error);

  function close() {
    if (updateAccount.isPending) {
      return;
    }
    updateAccount.reset();
    onClose();
  }

  function save(account: Account, values: AccountInput) {
    const changes = changedFields(toAccountInput(account), values);
    if (Object.keys(changes).length === 0) {
      close();
      return;
    }
    updateAccount.mutate({ id: account.id, changes }, { onSuccess: onClose });
  }

  return (
    <Modal opened={opened} onClose={close} title="Edit account">
      {account && (
        <AccountForm
          key={openCount}
          initialValues={toAccountInput(account)}
          typeLocked
          submitLabel="Save changes"
          isPending={updateAccount.isPending}
          {...errors}
          onSubmit={(values) => save(account, values)}
          onCancel={close}
        />
      )}
    </Modal>
  );
}
