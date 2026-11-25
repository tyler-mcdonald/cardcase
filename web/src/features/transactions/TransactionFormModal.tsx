import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useId } from "@mantine/hooks";
import { FormError } from "@/components/FormError";
import { MoneyInput } from "@/components/MoneyInput";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import type { AccountLabel } from "@/features/accounts/types";
import { AMOUNT_FIELDS } from "./constants";
import { LockedAccountInput } from "./LockedAccountInput";
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

function initialAmountField(values: TransactionFormValues): AmountField {
  return values.inflow === "" ? "outflow" : "inflow";
}

export function TransactionFormModal({
  title,
  initialValues,
  lockedAccountLabel,
  mutation,
  onSave,
  onClose,
  onDelete,
}: {
  title: string;
  initialValues: TransactionFormValues;
  lockedAccountLabel?: AccountLabel;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const amountId = useId();
  const [amountField, setAmountField] = useState(() =>
    initialAmountField(initialValues),
  );
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
      title={title}
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
          {lockedAccountLabel === undefined ? (
            <AccountSelect
              floatingHeight="viewport"
              label="Account"
              required
              {...form.getInputProps("accountId")}
            />
          ) : (
            <Input.Wrapper label="Account">
              <LockedAccountInput accountLabel={lockedAccountLabel} />
            </Input.Wrapper>
          )}
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
          <SimpleGrid cols={onDelete ? 2 : 1} spacing="xs">
            <Button
              variant="default"
              onClick={cancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            {onDelete && (
              <Button
                color="red"
                onClick={onDelete}
                disabled={mutation.isPending}
              >
                Delete
              </Button>
            )}
          </SimpleGrid>
        </Stack>
      </form>
    </Modal>
  );
}
