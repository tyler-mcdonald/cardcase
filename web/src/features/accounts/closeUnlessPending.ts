type ClosableMutation = {
  isPending: boolean;
  reset: () => void;
};

export function closeUnlessPending(
  mutation: ClosableMutation,
  onClose: () => void,
) {
  if (mutation.isPending) {
    return;
  }
  mutation.reset();
  onClose();
}
