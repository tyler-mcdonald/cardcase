type ClosableMutation = {
  isPending: boolean;
  reset: () => void;
};

export function useGuardedClose(
  mutation: ClosableMutation,
  onClose: () => void,
) {
  return function close() {
    if (mutation.isPending) {
      return;
    }
    mutation.reset();
    onClose();
  };
}
