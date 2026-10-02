export type ClosableMutation = {
  isPending: boolean;
  reset: () => void;
};

export function useGuardedClose(
  mutations: readonly ClosableMutation[],
  onClose: () => void,
) {
  return function close() {
    if (mutations.some((mutation) => mutation.isPending)) {
      return;
    }
    for (const mutation of mutations) {
      mutation.reset();
    }
    onClose();
  };
}
