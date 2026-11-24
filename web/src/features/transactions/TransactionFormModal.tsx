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
import { useId } from "@mantine/hooks";
import { DateField } from "@/components/DateField";
import { FormError } from "@/components/FormError";
import { MoneyInput } from "@/components/MoneyInput";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import classes from "./TransactionFormModal.module.css";
import type { TransactionFormValues } from "./transaction-form";
import { type SaveMutation, useTransactionForm } from "./use-transaction-form";

type Direction = "outflow" | "inflow";

const DIRECTION_OPTIONS = [
  { value: "outflow", label: "Outflow" },
  { value: "inflow", label: "Inflow" },
];

function initialDirection(values: TransactionFormValues): Direction {
  return values.inflow !== "" ? "inflow" : "outflow";
}

export function TransactionFormModal({
  title,
  initialValues,
  mutation,
  onSave,
  onClose,
}: {
  title: string;
  initialValues: TransactionFormValues;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
}) {
  const amountId = useId();
  const [direction, setDirection] = useState(() =>
    initialDirection(initialValues),
  );
  const { form, save, cancel, setAmount, formatAmount, saveError } =
    useTransactionForm({ initialValues, mutation, onSave, onClose });

  function changeDirection(next: Direction) {
    setAmount(next, form.values[direction]);
    setDirection(next);
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
                aria-label="Amount direction"
                classNames={{ label: classes.directionLabel }}
                data={DIRECTION_OPTIONS}
                value={direction}
                onChange={(value) => changeDirection(value as Direction)}
              />
              <MoneyInput
                id={amountId}
                value={form.values[direction]}
                onChange={(value) => setAmount(direction, value)}
                onBlur={() => formatAmount(direction)}
                error={Boolean(form.errors.amount)}
              />
            </Stack>
          </Input.Wrapper>
          <AccountSelect
            label="Account"
            required
            {...form.getInputProps("accountId")}
          />
          <DateField
            label="Date"
            required
            clearable={false}
            {...form.getInputProps("occurredOn")}
          />
          <TextInput
            label="Description"
            maxLength={1000}
            {...form.getInputProps("description")}
          />
          {saveError && <FormError message={saveError} />}
        </Stack>
        <SimpleGrid cols={2} spacing="xs" className={classes.actions}>
          <Button
            variant="default"
            h={44}
            onClick={cancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" h={44} disabled={mutation.isPending}>
            Save
          </Button>
        </SimpleGrid>
      </form>
    </Modal>
  );
}
