import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FormError } from "@/components/FormError";
import { apiErrorMessage } from "@/lib/api/errors";
import { AccountForm } from "./AccountForm";
import { useDeleteAccount, useUpdateAccount } from "./queries";
import type { Account, AccountInput, AccountUpdate } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";

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
  const close = useGuardedClose([updateAccount, deleteAccount], onClose);

  return (
    <Modal.Root opened={opened} onClose={close}>
      <Modal.Overlay />
      <Modal.Content>
        {account && (
          <EditAccountContent
            key={account.id}
            account={account}
            updateAccount={updateAccount}
            deleteAccount={deleteAccount}
            close={close}
            onClose={onClose}
          />
        )}
      </Modal.Content>
    </Modal.Root>
  );
}

function EditAccountContent({
  account,
  updateAccount,
  deleteAccount,
  close,
  onClose,
}: {
  account: Account;
  updateAccount: ReturnType<typeof useUpdateAccount>;
  deleteAccount: ReturnType<typeof useDeleteAccount>;
  close: () => void;
  onClose: () => void;
}) {
  const { fieldErrors, formError } = useAccountFormErrors(updateAccount.error);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  function save(values: AccountInput) {
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
    flushSync(() => setConfirmingDelete(false));
    deleteButtonRef.current?.focus();
  }

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {confirmingDelete ? `Delete ${account.name}?` : "Edit account"}
        </Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        {confirmingDelete && (
          <DeleteConfirmation
            isPending={deleteAccount.isPending}
            errorMessage={
              deleteAccount.error && apiErrorMessage(deleteAccount.error)
            }
            onConfirm={() =>
              deleteAccount.mutate(account.id, { onSuccess: onClose })
            }
            onCancel={cancelDelete}
          />
        )}
        <div hidden={confirmingDelete}>
          <AccountForm
            initialValues={account}
            typeLocked
            submitLabel="Save changes"
            isPending={updateAccount.isPending}
            fieldErrors={fieldErrors}
            formError={formError}
            onSubmit={save}
            onCancel={close}
            secondaryAction={
              <Button
                ref={deleteButtonRef}
                variant="light"
                color="red"
                onClick={startDelete}
                disabled={updateAccount.isPending}
              >
                Delete account
              </Button>
            }
          />
        </div>
      </Modal.Body>
    </>
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
        You'll lose access to this account and its transaction history. You
        can't undo this.
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
