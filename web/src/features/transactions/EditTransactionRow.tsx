import { useState } from "react";
import { Modal } from "@mantine/core";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";
import { useDeleteTransaction, useUpdateTransaction } from "./queries";
import { TransactionEditorRow } from "./TransactionEditorRow";
import {
  changedFields,
  toTransactionInput,
  transactionFormFrom,
  type TransactionField,
  type TransactionFormValues,
} from "./transaction-form";
import type { Transaction } from "./types";

export function EditTransactionRow({
  transaction,
  focusField,
  onClose,
}: {
  transaction: Transaction;
  focusField: TransactionField;
  onClose: () => void;
}) {
  const [openedWith] = useState(transaction);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const closeDeleteDialog = useGuardedClose([deleteTransaction], () =>
    setConfirmingDelete(false),
  );

  function save(values: TransactionFormValues) {
    const changes = changedFields(openedWith, toTransactionInput(values));
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    updateTransaction.mutate(
      { accountId: openedWith.account.id, id: openedWith.id, changes },
      { onSuccess: onClose },
    );
  }

  function confirmDelete() {
    deleteTransaction.mutate(
      { accountId: openedWith.account.id, id: openedWith.id },
      { onSuccess: onClose },
    );
  }

  return (
    <>
      <TransactionEditorRow
        initialValues={transactionFormFrom(openedWith)}
        lockedAccountName={openedWith.account.name}
        focusField={focusField === "accountId" ? "occurredOn" : focusField}
        mutation={updateTransaction}
        onSave={save}
        onClose={onClose}
        onDelete={() => setConfirmingDelete(true)}
      />
      <Modal
        opened={confirmingDelete}
        onClose={closeDeleteDialog}
        onClick={(event) => event.stopPropagation()}
        title="Delete this transaction?"
      >
        <DeleteConfirmation
          message="This can't be undone."
          isPending={deleteTransaction.isPending}
          error={deleteTransaction.error}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      </Modal>
    </>
  );
}
