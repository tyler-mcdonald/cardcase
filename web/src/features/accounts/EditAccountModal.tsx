import { useState } from "react";
import { Alert, Button, Group, Modal, Stack } from "@mantine/core";
import { apiErrorMessage } from "@/lib/api/errors";
import { AccountForm } from "./AccountForm";
import { useDeleteAccount, useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [wasOpened, setWasOpened] = useState(opened);

  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setConfirmingDelete(false);
    }
  }

  const close = useGuardedClose(
    {
      isPending: updateAccount.isPending || deleteAccount.isPending,
      reset: () => {
        updateAccount.reset();
        deleteAccount.reset();
      },
    },
    onClose,
  );

  function save(account: Account, values: AccountInput) {
    const changes = editedFields(account, values);
    if (Object.keys(changes).length === 0) {
      close();
      return;
    }
    updateAccount.mutate({ id: account.id, changes }, { onSuccess: onClose });
  }

  function startDelete() {
    updateAccount.reset();
    setConfirmingDelete(true);
  }

  function cancelDelete() {
    deleteAccount.reset();
    setConfirmingDelete(false);
  }

  function confirmDelete(account: Account) {
    deleteAccount.mutate(account.id, { onSuccess: onClose });
  }

  const title =
    account && confirmingDelete ? `Delete ${account.name}?` : "Edit account";

  return (
    <Modal opened={opened} onClose={close} title={title}>
      {account &&
        (confirmingDelete ? (
          <DeleteConfirmation
            isPending={deleteAccount.isPending}
            error={deleteAccount.error}
            onConfirm={() => confirmDelete(account)}
            onCancel={cancelDelete}
          />
        ) : (
          <AccountForm
            key={account.id}
            initialValues={account}
            typeLocked
            submitLabel="Save changes"
            isPending={updateAccount.isPending}
            error={updateAccount.error}
            onSubmit={(values) => save(account, values)}
            onCancel={close}
            onDelete={startDelete}
          />
        ))}
    </Modal>
  );
}

function DeleteConfirmation({
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  isPending: boolean;
  error: Error | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Stack>
      {error && (
        <Alert color="red" role="alert">
          {apiErrorMessage(error)}
        </Alert>
      )}
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
