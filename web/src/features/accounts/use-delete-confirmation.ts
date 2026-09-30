import { useState } from "react";

export function useDeleteConfirmation(opened: boolean) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [wasOpened, setWasOpened] = useState(opened);

  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setConfirmingDelete(false);
    }
  }

  return [confirmingDelete, setConfirmingDelete] as const;
}
