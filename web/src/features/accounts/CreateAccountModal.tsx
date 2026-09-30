import { Modal } from "@mantine/core";
import { AccountForm } from "./AccountForm";
import { useCreateAccount } from "./queries";
import type { AccountInput } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";
import { useGuardedClose } from "./use-guarded-close";

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
  const close = useGuardedClose([createAccount], onClose);
  const { fieldErrors, formError } = useAccountFormErrors(createAccount.error);

  return (
    <Modal opened={opened} onClose={close} title="Add account">
      <AccountForm
        initialValues={INITIAL_VALUES}
        submitLabel="Add account"
        isPending={createAccount.isPending}
        fieldErrors={fieldErrors}
        formError={formError}
        onSubmit={(values) =>
          createAccount.mutate(values, { onSuccess: onCreated })
        }
        onCancel={close}
      />
    </Modal>
  );
}
