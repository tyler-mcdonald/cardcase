import { useState, type FocusEvent, type KeyboardEvent } from "react";
import {
  Button,
  Group,
  NumberInput,
  type NumberInputProps,
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
import {
  type ClosableMutation,
  useGuardedClose,
} from "@/lib/hooks/use-guarded-close";
import { COLUMN_COUNT } from "./constants";
import classes from "./TransactionsTable.module.css";
import {
  type Amount,
  type TransactionFormValues,
  validateTransactionForm,
} from "./transaction-form";

type AmountField = "outflow" | "inflow";

function oppositeAmountField(field: AmountField): AmountField {
  return field === "outflow" ? "inflow" : "outflow";
}

function AmountInput(props: NumberInputProps) {
  return (
    <NumberInput
      size="xs"
      min={0}
      allowNegative={false}
      decimalScale={2}
      hideControls
      {...props}
    />
  );
}

function ErrorMessages({ messages }: { messages: string[] }) {
  return (
    <Stack gap={2} role={messages.length > 0 ? "alert" : undefined}>
      {messages.map((message) => (
        <Text key={message} size="sm" c="red">
          {message}
        </Text>
      ))}
    </Stack>
  );
}

type SaveMutation = ClosableMutation & { error: unknown };

export function TransactionEditorRow({
  initialValues,
  lockedAccountName,
  mutation,
  onSave,
  onClose,
}: {
  initialValues: TransactionFormValues;
  lockedAccountName?: string;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
}) {
  const [editorRow, setEditorRow] = useState<HTMLTableRowElement | null>(null);
  const [actionsRow, setActionsRow] = useState<HTMLTableRowElement | null>(
    null,
  );
  const [accountDropdownOpened, setAccountDropdownOpened] = useState(false);
  const [dateDropdownOpened, setDateDropdownOpened] = useState(false);
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

  useClickOutside(cancel, null, [editorRow, actionsRow]);

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
  if (mutation.error) {
    messages.push(apiErrorMessage(mutation.error));
  }

  return (
    <>
      <Table.Tr
        ref={setEditorRow}
        className={classes.editorRow}
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
          {lockedAccountName === undefined ? (
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
          ) : (
            <TextInput
              aria-label="Account"
              size="xs"
              value={lockedAccountName}
              disabled
              readOnly
            />
          )}
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
          <AmountInput aria-label="Outflow" {...amountInputProps("outflow")} />
        </Table.Td>
        <Table.Td>
          <AmountInput aria-label="Inflow" {...amountInputProps("inflow")} />
        </Table.Td>
      </Table.Tr>
      <Table.Tr
        ref={setActionsRow}
        className={classes.editorRow}
        onKeyDown={cancelOnEscape}
      >
        <Table.Td colSpan={COLUMN_COUNT}>
          <Group justify="space-between" wrap="nowrap">
            <ErrorMessages messages={messages} />
            <Group gap="xs" wrap="nowrap">
              <Button
                size="xs"
                variant="default"
                onClick={cancel}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={() => save()}
                loading={mutation.isPending}
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
