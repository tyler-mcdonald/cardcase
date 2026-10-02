import { useState, type FocusEvent, type KeyboardEvent } from "react";
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
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { apiErrorMessage } from "@/lib/api/errors";
import { localDateString } from "@/lib/format";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";
import { COLUMN_COUNT } from "./constants";
import classes from "./TransactionsTable.module.css";
import { useCreateTransaction } from "./queries";

type Amount = string | number;
type AmountField = "outflow" | "inflow";

const OPPOSITE_AMOUNT_FIELD: Record<AmountField, AmountField> = {
  outflow: "inflow",
  inflow: "outflow",
};

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

function validate({
  accountId,
  occurredOn,
  outflow,
  inflow,
}: NewTransactionValues) {
  const hasAccount = Boolean(accountId);
  const hasDate = Boolean(occurredOn);
  const hasAmount = isPositive(outflow) || isPositive(inflow);

  return {
    accountId: hasAccount ? null : "Account is required",
    occurredOn: hasDate ? null : "Date is required",
    amount: hasAmount ? null : "Enter either an outflow or an inflow",
  };
}

function signedAmount({ outflow, inflow }: NewTransactionValues): string {
  return (Number(inflow) - Number(outflow)).toFixed(2);
}

function toNewTransaction(values: NewTransactionValues) {
  return {
    accountId: values.accountId!,
    input: {
      amount: signedAmount(values),
      description: values.description.trim(),
      occurred_on: values.occurredOn!,
    },
  };
}

export function NewTransactionRow({ onClose }: { onClose: () => void }) {
  const createTransaction = useCreateTransaction();
  const [editorRow, setEditorRow] = useState<HTMLTableRowElement | null>(null);
  const [actionsRow, setActionsRow] = useState<HTMLTableRowElement | null>(
    null,
  );
  const [accountDropdownOpened, setAccountDropdownOpened] = useState(false);
  const [dateDropdownOpened, setDateDropdownOpened] = useState(false);
  const form = useForm<NewTransactionValues>({
    initialValues: {
      accountId: null,
      occurredOn: localDateString(new Date()),
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
    createTransaction.mutate(toNewTransaction(values), { onSuccess: onClose });
  });

  const cancel = useGuardedClose([createTransaction], onClose);

  useClickOutside(cancel, null, [editorRow, actionsRow]);

  function setAmount(field: AmountField, value: Amount) {
    form.setFieldValue(field, value);
    form.clearFieldError("amount");
    if (value !== "") {
      form.setFieldValue(OPPOSITE_AMOUNT_FIELD[field], "");
    }
  }

  function formatAmount(field: AmountField) {
    const value = form.values[field];
    if (value !== "") {
      form.setFieldValue(field, Number(value).toFixed(2));
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

  function saveOnEnter(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.defaultPrevented) {
      event.preventDefault();
      save();
    }
  }

  function cancelOnEscape(event: KeyboardEvent) {
    if (
      event.key === "Escape" &&
      !accountDropdownOpened &&
      !dateDropdownOpened
    ) {
      cancel();
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent) {
    saveOnEnter(event);
    cancelOnEscape(event);
  }

  const accountInputProps = form.getInputProps("accountId");

  function openAccountDropdownOnTab(event: KeyboardEvent) {
    if (event.key === "Tab") {
      setAccountDropdownOpened(true);
    }
  }

  function closeAccountDropdownOnBlur(event: FocusEvent) {
    setAccountDropdownOpened(false);
    accountInputProps.onBlur(event);
  }

  const messages = Object.values(form.errors).map(String);
  if (createTransaction.error) {
    messages.push(apiErrorMessage(createTransaction.error));
  }

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
            popoverProps={{
              withinPortal: false,
              onOpen: () => setDateDropdownOpened(true),
              onClose: () => setDateDropdownOpened(false),
            }}
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
            {...accountInputProps}
            error={Boolean(form.errors.accountId)}
            dropdownOpened={accountDropdownOpened}
            onDropdownOpen={() => setAccountDropdownOpened(true)}
            onDropdownClose={() => setAccountDropdownOpened(false)}
            onKeyUp={openAccountDropdownOnTab}
            onBlur={closeAccountDropdownOnBlur}
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
            {...amountInputProps("outflow")}
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
            {...amountInputProps("inflow")}
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
                onClick={cancel}
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
