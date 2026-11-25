import type { AccountLabel } from "@/features/accounts/types";
import { DeleteTransactionModal } from "./DeleteTransactionModal";
import { TransactionEditorRow } from "./TransactionEditorRow";
import type { TransactionField } from "./transaction-form";
import type { Transaction } from "./types";
import { useTransactionEdit } from "./use-transaction-mutations";

export function EditTransactionRow({
  transaction,
  accountLabel,
  focusField,
  onClose,
}: {
  transaction: Transaction;
  accountLabel: AccountLabel;
  focusField: TransactionField;
  onClose: () => void;
}) {
  const { initialValues, mutation, save, deletion } = useTransactionEdit(
    transaction,
    onClose,
  );

  return (
    <>
      <TransactionEditorRow
        initialValues={initialValues}
        lockedAccountLabel={accountLabel}
        focusField={focusField === "accountId" ? "occurredOn" : focusField}
        mutation={mutation}
        onSave={save}
        onClose={onClose}
        onDelete={deletion.request}
      />
      <DeleteTransactionModal deletion={deletion} />
    </>
  );
}
