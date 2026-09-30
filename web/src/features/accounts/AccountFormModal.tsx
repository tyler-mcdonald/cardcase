import type { ReactNode } from "react";
import { Modal } from "@mantine/core";

type ClosableMutation = {
  isPending: boolean;
  reset: () => void;
};

export function AccountFormModal({
  title,
  opened,
  onClose,
  mutation,
  children,
}: {
  title: string;
  opened: boolean;
  onClose: () => void;
  mutation: ClosableMutation;
  children: (close: () => void) => ReactNode;
}) {
  function close() {
    if (mutation.isPending) {
      return;
    }
    mutation.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={close} title={title}>
      {children(close)}
    </Modal>
  );
}
