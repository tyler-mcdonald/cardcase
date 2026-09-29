import { Modal } from "@mantine/core";
import { AccountForm } from "./AccountForm";
import { closeUnlessPending } from "./closeUnlessPending";
import { useCreateAccount } from "./queries";
import type { AccountInput } from "./types";

const INITIAL_VALUES: AccountInput = {
  name: "",
  type: "gift_card",
  expires_on: null,
  description: "",
};

export function CreateAccountModal({
  opened,
  onCreated,
  onClose,
}: {
  opened: boolean;
  onCreated: () => void;
  onClose: () => void;
}) {
  const createAccount = useCreateAccount();

  function close() {
    closeUnlessPending(createAccount, onClose);
  }

  return (
    <Modal opened={opened} onClose={close} title="Add account">
      <AccountForm
        initialValues={INITIAL_VALUES}
        submitLabel="Add account"
        isPending={createAccount.isPending}
        error={createAccount.error}
        onSubmit={(values) =>
          createAccount.mutate(values, { onSuccess: onCreated })
        }
        onCancel={close}
      />
    </Modal>
  );
}
