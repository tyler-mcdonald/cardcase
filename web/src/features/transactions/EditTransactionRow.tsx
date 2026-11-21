import { useState } from "react";
import type { AccountLabel } from "@/features/accounts/types";
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
  accountLabel,
  focusField,
  onClose,
}: {
  transaction: Transaction;
  accountLabel: AccountLabel;
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
