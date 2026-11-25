import type { AccountLabel } from "@/features/accounts/types";
import { DeleteTransactionModal } from "./DeleteTransactionModal";
import { TransactionFormModal } from "./TransactionFormModal";
import type { Transaction } from "./types";
import { useTransactionEdit } from "./use-transaction-mutations";

export function EditTransactionModal({
  transaction,
  accountLabel,
  onClose,
}: {
  transaction: Transaction;
  accountLabel: AccountLabel;
  onClose: () => void;
}) {
  const { initialValues, mutation, save, deletion } = useTransactionEdit(
    transaction,
    onClose,
  );

  return (
    <>
      <TransactionFormModal
        title="Edit transaction"
        initialValues={initialValues}
        lockedAccountLabel={accountLabel}
        mutation={mutation}
        onSave={save}
        onClose={onClose}
        onDelete={deletion.request}
      />
      <DeleteTransactionModal deletion={deletion} />
    </>
  );
}
