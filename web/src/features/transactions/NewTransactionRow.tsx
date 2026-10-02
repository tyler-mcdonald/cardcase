import { useState, type KeyboardEvent } from "react";
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useClickOutside } from "@mantine/hooks";
import dayjs from "dayjs";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { apiErrorMessage } from "@/lib/api/errors";
import { COLUMN_COUNT } from "./constants";
import classes from "./TransactionsTable.module.css";
import { useCreateTransaction } from "./queries";

type Amount = string | number;

type NewTransactionValues = {
  accountId: string | null;
  occurredOn: string | null;
  description: string;
  outflow: Amount;
  inflow: Amount;
};

function isPositive(amount: Amount): boolean {
  return Number(amount) > 0;
}

function validate(values: NewTransactionValues) {
  const filledAmounts = [values.outflow, values.inflow].filter(isPositive);
  return {
    accountId: values.accountId ? null : "Account is required",
    occurredOn: values.occurredOn ? null : "Date is required",
    amount:
      filledAmounts.length === 1
        ? null
        : "Enter either an outflow or an inflow",
  };
}

function isDropdownOpen(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    target.getAttribute("aria-expanded") === "true"
  );
}

function signedAmount({ outflow, inflow }: NewTransactionValues): string {
  return isPositive(outflow)
    ? (-Number(outflow)).toFixed(2)
    : Number(inflow).toFixed(2);
}

export function NewTransactionRow({ onClose }: { onClose: () => void }) {
  const createTransaction = useCreateTransaction();
  const [editorRow, setEditorRow] = useState<HTMLTableRowElement | null>(null);
  const [actionsRow, setActionsRow] = useState<HTMLTableRowElement | null>(
    null,
  );
  const form = useForm<NewTransactionValues>({
    initialValues: {
      accountId: null,
      occurredOn: dayjs().format("YYYY-MM-DD"),
      description: "",
      outflow: "",
      inflow: "",
    },
    validate,
  });

  const save = form.onSubmit((values) => {
    if (createTransaction.isPending) {
      return;
    }
    createTransaction.mutate(
      {
        accountId: values.accountId!,
        input: {
          amount: signedAmount(values),
          description: values.description.trim(),
          occurred_on: values.occurredOn!,
        },
      },
      { onSuccess: onClose },
    );
  });

  function cancel() {
    if (!createTransaction.isPending) {
      onClose();
    }
  }

  useClickOutside(cancel, null, [editorRow, actionsRow]);

  function setAmount(field: "outflow" | "inflow", value: Amount) {
    const otherField = field === "outflow" ? "inflow" : "outflow";
    form.setFieldValue(field, value);
    if (value !== "") {
      form.setFieldValue(otherField, "");
    }
    form.clearFieldError("amount");
  }

  function saveOnEnter(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.defaultPrevented) {
      event.preventDefault();
      save();
    }
  }

  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && !isDropdownOpen(event.target)) {
      cancel();
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent) {
    saveOnEnter(event);
    cancelOnEscape(event);
  }

  const messages = Object.values(form.errors).map(String);
  if (createTransaction.error) {
    messages.push(apiErrorMessage(createTransaction.error));
  }
  const hasAmountError = Boolean(form.errors.amount);

  return (
    <>
      <Table.Tr
        ref={setEditorRow}
        className={classes.editor}
        onKeyDown={handleEditorKeyDown}
      >
        <Table.Td>
          <DateInput
            aria-label="Date"
            autoFocus
            size="xs"
            valueFormat="MMM D, YYYY"
            allowDeselect
            popoverProps={{ withinPortal: false }}
            {...form.getInputProps("occurredOn")}
            error={Boolean(form.errors.occurredOn)}
          />
        </Table.Td>
        <Table.Td colSpan={2}>
          <AccountSelect
            aria-label="Account"
            placeholder="Account"
            comboboxProps={{ withinPortal: false }}
            size="xs"
            {...form.getInputProps("accountId")}
            error={Boolean(form.errors.accountId)}
          />
        </Table.Td>
        <Table.Td>
          <TextInput
            aria-label="Description"
            placeholder="Description"
            size="xs"
            maxLength={1000}
            {...form.getInputProps("description")}
          />
        </Table.Td>
        <Table.Td>
          <NumberInput
            aria-label="Outflow"
            size="xs"
            min={0}
            allowNegative={false}
            decimalScale={2}
            hideControls
            value={form.values.outflow}
            onChange={(value) => setAmount("outflow", value)}
            error={hasAmountError}
          />
        </Table.Td>
        <Table.Td>
          <NumberInput
            aria-label="Inflow"
            size="xs"
            min={0}
            allowNegative={false}
            decimalScale={2}
            hideControls
            value={form.values.inflow}
            onChange={(value) => setAmount("inflow", value)}
            error={hasAmountError}
          />
        </Table.Td>
      </Table.Tr>
      <Table.Tr
        ref={setActionsRow}
        className={classes.editor}
        onKeyDown={cancelOnEscape}
      >
        <Table.Td colSpan={COLUMN_COUNT}>
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2} role={messages.length > 0 ? "alert" : undefined}>
              {messages.map((message) => (
                <Text key={message} size="sm" c="red">
                  {message}
                </Text>
              ))}
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <Button
                size="xs"
                variant="default"
                onClick={onClose}
                disabled={createTransaction.isPending}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={() => save()}
                loading={createTransaction.isPending}
              >
                Save
              </Button>
            </Group>
          </Group>
        </Table.Td>
      </Table.Tr>
    </>
  );
}
