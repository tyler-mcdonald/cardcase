import { TransactionEditorRow } from "./TransactionEditorRow";
import { emptyTransactionForm } from "./transaction-form";
import { useCreateTransactionSave } from "./use-transaction-mutations";

export function NewTransactionRow({
  accountId,
  onClose,
}: {
  accountId?: string;
  onClose: () => void;
}) {
  const { mutation, save } = useCreateTransactionSave(onClose);

  return (
    <TransactionEditorRow
      initialValues={emptyTransactionForm(accountId)}
      mutation={mutation}
      onSave={save}
      onClose={onClose}
    />
  );
}
