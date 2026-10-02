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
  const updateTransaction = useUpdateTransaction();

  function save(values: TransactionFormValues) {
    const changes = changedFields(transaction, toTransactionInput(values));
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    updateTransaction.mutate(
      { accountId: transaction.account.id, id: transaction.id, changes },
      { onSuccess: onClose },
    );
  }

  return (
    <TransactionEditorRow
      initialValues={transactionFormFrom(transaction)}
      lockedAccountName={transaction.account.name}
      mutation={updateTransaction}
      onSave={save}
      onClose={onClose}
    />
  );
}
