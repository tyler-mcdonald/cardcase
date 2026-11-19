import { useState } from "react";
import { DeleteTransactionModal } from "./DeleteTransactionModal";
import { TransactionEditorRow } from "./TransactionEditorRow";
import { transactionFormFrom, type TransactionField } from "./transaction-form";
import type { Transaction } from "./types";
import {
  useTransactionDelete,
  useUpdateTransactionSave,
} from "./use-transaction-mutations";

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
  const { mutation, save } = useUpdateTransactionSave(openedWith, onClose);
  const deletion = useTransactionDelete(openedWith, onClose);

  return (
    <>
      <TransactionEditorRow
        initialValues={transactionFormFrom(openedWith)}
        lockedAccountName={openedWith.account.name}
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
