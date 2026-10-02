import { useState } from "react";
import { useUpdateTransaction } from "./queries";
import { TransactionEditorRow } from "./TransactionEditorRow";
import {
  changedFields,
  toTransactionInput,
  transactionFormFrom,
  type TransactionFormValues,
} from "./transaction-form";
import type { Transaction } from "./types";

export function EditTransactionRow({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const [openedWith] = useState(transaction);
  const updateTransaction = useUpdateTransaction();

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

  return (
    <TransactionEditorRow
      initialValues={transactionFormFrom(openedWith)}
      lockedAccountName={openedWith.account.name}
      mutation={updateTransaction}
      onSave={save}
      onClose={onClose}
    />
  );
}
