import { Modal } from "@mantine/core";
import { AccountForm, type AccountFormValues } from "./AccountForm";
import { useCreateAccount } from "./queries";
import type { AccountCreateInput } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";
import { toAmountString } from "@/lib/format";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";

const INITIAL_VALUES: AccountFormValues = {
  name: "",
  type: "gift_card",
  initial_balance: 0,
  expires_on: null,
  description: "",
};

function toCreateInput({
  initial_balance,
  ...values
}: AccountFormValues): AccountCreateInput {
  return { ...values, initial_balance: toAmountString(initial_balance!) };
}

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
          createAccount.mutate(toCreateInput(values), {
            onSuccess: onCreated,
          })
        }
        onCancel={close}
      />
    </Modal>
  );
}
