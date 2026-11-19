import { useForm } from "@mantine/form";
import { apiErrorMessage } from "@/lib/api/errors";
import { toTwoDecimalString } from "@/lib/format";
import {
  type ClosableMutation,
  useGuardedClose,
} from "@/lib/hooks/use-guarded-close";
import {
  type Amount,
  type TransactionFormValues,
  validateTransactionForm,
} from "./transaction-form";

type AmountField = "outflow" | "inflow";

export type SaveMutation = ClosableMutation & { error: unknown };

function oppositeAmountField(field: AmountField): AmountField {
  return field === "outflow" ? "inflow" : "outflow";
}

type UseTransactionFormOptions = {
  initialValues: TransactionFormValues;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
};

export function useTransactionForm({
  initialValues,
  mutation,
  onSave,
  onClose,
}: UseTransactionFormOptions) {
  const form = useForm<TransactionFormValues>({
    initialValues,
    validate: validateTransactionForm,
  });

  const save = form.onSubmit((values) => {
    if (mutation.isPending) {
      return;
    }
    onSave(values);
  });

  const cancel = useGuardedClose([mutation], onClose);

  function setAmount(field: AmountField, value: Amount) {
    form.setFieldValue(field, value);
    form.clearFieldError("amount");
    if (value !== "") {
      form.setFieldValue(oppositeAmountField(field), "");
    }
  }

  function formatAmount(field: AmountField) {
    const value = form.values[field];
    if (value !== "") {
      form.setFieldValue(field, toTwoDecimalString(value));
    }
  }

  function amountInputProps(field: AmountField) {
    return {
      value: form.values[field],
      onChange: (value: Amount) => setAmount(field, value),
      onBlur: () => formatAmount(field),
      error: Boolean(form.errors.amount),
    };
  }

  const errorMessages = Object.values(form.errors).map(String);
  if (mutation.error) {
    errorMessages.push(apiErrorMessage(mutation.error));
  }

  return { form, save, cancel, amountInputProps, errorMessages };
}
