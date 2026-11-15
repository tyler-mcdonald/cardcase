import { useCreateTransaction } from "./queries";
import { TransactionEditorRow } from "./TransactionEditorRow";
import {
  emptyTransactionForm,
  toTransactionInput,
  type TransactionFormValues,
} from "./transaction-form";

export function NewTransactionRow({
  accountId,
  onClose,
}: {
  accountId?: string;
  onClose: () => void;
}) {
  const createTransaction = useCreateTransaction();

  function save(values: TransactionFormValues) {
    createTransaction.mutate(
      { accountId: values.accountId!, input: toTransactionInput(values) },
      { onSuccess: onClose },
    );
  }

  return (
    <TransactionEditorRow
      initialValues={emptyTransactionForm(accountId)}
      mutation={createTransaction}
      onSave={save}
      onClose={onClose}
    />
  );
}
