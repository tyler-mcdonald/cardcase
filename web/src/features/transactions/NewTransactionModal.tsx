import { TransactionFormModal } from "./TransactionFormModal";
import { emptyTransactionForm } from "./transaction-form";
import { useCreateTransactionSave } from "./use-transaction-mutations";

export function NewTransactionModal({
  accountId,
  onClose,
}: {
  accountId?: string;
  onClose: () => void;
}) {
  const { mutation, save } = useCreateTransactionSave(onClose);

  return (
    <TransactionFormModal
      title="Add transaction"
      initialValues={emptyTransactionForm(accountId)}
      mutation={mutation}
      onSave={save}
      onClose={onClose}
    />
  );
}
