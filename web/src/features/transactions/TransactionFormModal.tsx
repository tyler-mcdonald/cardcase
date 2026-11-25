import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useId } from "@mantine/hooks";
import { FormError } from "@/components/FormError";
import { MoneyInput } from "@/components/MoneyInput";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { AMOUNT_FIELDS } from "./constants";
import classes from "./TransactionFormModal.module.css";
import type { TransactionFormValues } from "./transaction-form";
import {
  type AmountField,
  type SaveMutation,
  useTransactionForm,
} from "./use-transaction-form";

const AMOUNT_FIELD_OPTIONS = AMOUNT_FIELDS.map(({ field, label }) => ({
  value: field,
  label,
}));

export function TransactionFormModal({
  initialValues,
  mutation,
  onSave,
  onClose,
}: {
  initialValues: TransactionFormValues;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
}) {
  const amountId = useId();
  const [amountField, setAmountField] = useState<AmountField>("outflow");
  const { form, save, cancel, setAmount, formatAmount, saveError } =
    useTransactionForm({ initialValues, mutation, onSave, onClose });

  function changeAmountField(next: AmountField) {
    if (form.values[amountField] !== "") {
      setAmount(next, form.values[amountField]);
    }
    setAmountField(next);
  }

  return (
    <Modal
      opened
      fullScreen
      onClose={cancel}
      title="Add transaction"
      closeOnClickOutside={false}
      closeOnEscape={false}
      closeButtonProps={{ size: "xl", "aria-label": "Close" }}
      classNames={{ content: classes.content, body: classes.body }}
    >
      <form className={classes.form} onSubmit={save}>
        <Stack>
          <Input.Wrapper
            id={amountId}
            label="Amount"
            required
            error={form.errors.amount}
          >
            <Stack gap="xs">
              <SegmentedControl
                fullWidth
                aria-label="Outflow or inflow"
                classNames={{ label: classes.amountFieldLabel }}
                data={AMOUNT_FIELD_OPTIONS}
                value={amountField}
                onChange={(value) => changeAmountField(value as AmountField)}
              />
              <MoneyInput
                id={amountId}
                value={form.values[amountField]}
                onChange={(value) => setAmount(amountField, value)}
                onBlur={() => formatAmount(amountField)}
                error={Boolean(form.errors.amount)}
              />
            </Stack>
          </Input.Wrapper>
          <AccountSelect
            floatingHeight="viewport"
            label="Account"
            required
            {...form.getInputProps("accountId")}
          />
          <DateInput
            label="Date"
            required
            valueFormat="MMM D, YYYY"
            {...form.getInputProps("occurredOn")}
          />
          <TextInput
            label="Description"
            maxLength={1000}
            {...form.getInputProps("description")}
          />
          {saveError && <FormError message={saveError} />}
        </Stack>
        <Stack gap="xs" className={classes.actions}>
          <Button type="submit" loading={mutation.isPending}>
            Save
          </Button>
          <Button
            variant="default"
            onClick={cancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
