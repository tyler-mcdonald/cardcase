import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { apiErrorMessage } from "@/lib/api/errors";
import { AccountForm } from "./AccountForm";
import { FormError } from "./FormError";
import { useDeleteAccount, useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";
import { useGuardedClose } from "./use-guarded-close";

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
  const deleteAccount = useDeleteAccount();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [wasOpened, setWasOpened] = useState(opened);
  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setConfirmingDeleteId(null);
    }
  }
  const confirmingDelete =
    account !== null && confirmingDeleteId === account.id;
  const close = useGuardedClose([updateAccount, deleteAccount], onClose);
  const { fieldErrors, formError } = useAccountFormErrors(updateAccount.error);

  function save(account: Account, values: AccountInput) {
    const changes = editedFields(account, values);
    if (Object.keys(changes).length === 0) {
      close();
      return;
    }
    updateAccount.mutate({ id: account.id, changes }, { onSuccess: onClose });
  }

  function startDelete(account: Account) {
    updateAccount.reset();
    setConfirmingDeleteId(account.id);
  }

  function cancelDelete() {
    deleteAccount.reset();
    setConfirmingDeleteId(null);
  }

  function confirmDelete(account: Account) {
    deleteAccount.mutate(account.id, { onSuccess: onClose });
  }

  const title = confirmingDelete ? `Delete ${account.name}?` : "Edit account";

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={title}
    >
      {account && (
        <>
          {confirmingDelete && (
            <DeleteConfirmation
              isPending={deleteAccount.isPending}
              errorMessage={
                deleteAccount.error && apiErrorMessage(deleteAccount.error)
              }
              onConfirm={() => confirmDelete(account)}
              onCancel={cancelDelete}
            />
          )}
          <div hidden={confirmingDelete}>
            <AccountForm
              key={account.id}
              initialValues={account}
              typeLocked
              submitLabel="Save changes"
              isPending={updateAccount.isPending}
              fieldErrors={fieldErrors}
              formError={formError}
              onSubmit={(values) => save(account, values)}
              onCancel={close}
              secondaryAction={
                <Button
                  variant="light"
                  color="red"
                  onClick={() => startDelete(account)}
                  disabled={updateAccount.isPending}
                >
                  Delete account
                </Button>
              }
            />
          </div>
        </>
      )}
    </Modal>
  );
}

function DeleteConfirmation({
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  isPending: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Stack>
      <Text size="sm">
        This removes the account and its transaction history. You can't undo
        this.
      </Text>
      {errorMessage && <FormError message={errorMessage} />}
      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={onCancel}
          disabled={isPending}
          autoFocus
        >
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isPending}>
          Delete
        </Button>
      </Group>
    </Stack>
  );
}
