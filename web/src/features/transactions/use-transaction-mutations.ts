import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "./queries";
import {
  changedFields,
  toTransactionInput,
  transactionFormFrom,
  type TransactionFormValues,
} from "./transaction-form";
import type { Transaction } from "./types";

export function useCreateTransactionSave(onClose: () => void) {
  const mutation = useCreateTransaction();

  function save(values: TransactionFormValues) {
    mutation.mutate(
      { accountId: values.accountId!, input: toTransactionInput(values) },
      { onSuccess: onClose },
    );
  }

  return { mutation, save };
}

export function useUpdateTransactionSave(
  transaction: Transaction,
  onClose: () => void,
) {
  const mutation = useUpdateTransaction();

  function save(values: TransactionFormValues) {
    const changes = changedFields(transaction, toTransactionInput(values));
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    mutation.mutate(
      { accountId: transaction.account.id, id: transaction.id, changes },
      { onSuccess: onClose },
    );
  }

  return { mutation, save };
}

export function useTransactionDelete(
  transaction: Transaction,
  onClose: () => void,
) {
  const [confirming, { open: request, close }] = useDisclosure(false);
  const mutation = useDeleteTransaction();
  const cancel = useGuardedClose([mutation], close);

  function confirm() {
    mutation.mutate(
      { accountId: transaction.account.id, id: transaction.id },
      { onSuccess: onClose },
    );
  }

  return {
    confirming,
    request,
    cancel,
    confirm,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export type TransactionDelete = ReturnType<typeof useTransactionDelete>;

export function useTransactionEdit(
  transaction: Transaction,
  onClose: () => void,
) {
  const [openedWith] = useState(transaction);
  const { mutation, save } = useUpdateTransactionSave(openedWith, onClose);
  const deletion = useTransactionDelete(openedWith, onClose);

  return {
    initialValues: transactionFormFrom(openedWith),
    mutation,
    save,
    deletion,
  };
}
