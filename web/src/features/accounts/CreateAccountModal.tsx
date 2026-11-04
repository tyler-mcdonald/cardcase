import { Modal } from "@mantine/core";
import { type FormRulesRecord, isNotEmpty } from "@mantine/form";
import { AccountForm } from "./AccountForm";
import { useCreateAccount } from "./queries";
import type { AccountCreateInput, AccountInput } from "./types";
import { useAccountFormErrors } from "./use-account-form-errors";
import { MoneyInput } from "@/components/MoneyInput";
import { toTwoDecimalString } from "@/lib/format";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";

type CreateAccountValues = AccountInput & { initial_balance: number | "" };

const INITIAL_VALUES: CreateAccountValues = {
  name: "",
  type: "gift_card",
  initial_balance: 0,
  expires_on: null,
  description: "",
};

const requireInitialBalance = isNotEmpty("Initial balance is required");

const VALIDATE: FormRulesRecord<CreateAccountValues> = {
  initial_balance: (value) =>
    Number.isNaN(Number(value))
      ? "Initial balance must be a number"
      : requireInitialBalance(value),
};

function toCreateInput({
  initial_balance,
  ...values
}: CreateAccountValues): AccountCreateInput {
  return { ...values, initial_balance: toTwoDecimalString(initial_balance) };
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
        extraValidate={VALIDATE}
        extraFields={(form) => (
          <MoneyInput
            label="Initial balance"
            required
            {...form.getInputProps("initial_balance")}
          />
        )}
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
