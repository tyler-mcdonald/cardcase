import { Modal } from "@mantine/core";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import type { TransactionDelete } from "./use-transaction-mutations";

export function DeleteTransactionModal({
  deletion,
}: {
  deletion: TransactionDelete;
}) {
  return (
    <Modal
      opened={deletion.confirming}
      onClose={deletion.cancel}
      onClick={(event) => event.stopPropagation()}
      title="Delete this transaction?"
    >
      <DeleteConfirmation
        message="This can't be undone."
        isPending={deletion.isPending}
        error={deletion.error}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </Modal>
  );
}
