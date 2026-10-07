import { useState, type FocusEvent, type KeyboardEvent } from "react";
import { Button, Group, Stack, Table, Text, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useClickOutside } from "@mantine/hooks";
import { MoneyInput } from "@/components/MoneyInput";
import { AccountSelect } from "@/features/accounts/AccountSelect";
import { apiErrorMessage } from "@/lib/api/errors";
import { toAmountString } from "@/lib/format";
import {
  type ClosableMutation,
  useGuardedClose,
} from "@/lib/hooks/use-guarded-close";
import { COLUMN_COUNT } from "./constants";
import classes from "./TransactionsTable.module.css";
import {
  type Amount,
  type TransactionField,
  type TransactionFormValues,
  validateTransactionForm,
} from "./transaction-form";

type AmountField = "outflow" | "inflow";

function oppositeAmountField(field: AmountField): AmountField {
  return field === "outflow" ? "inflow" : "outflow";
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
  focusField = "occurredOn",
  mutation,
  onSave,
  onClose,
  onDelete,
}: {
  initialValues: TransactionFormValues;
  lockedAccountName?: string;
  focusField?: TransactionField;
  mutation: SaveMutation;
  onSave: (values: TransactionFormValues) => void;
  onClose: () => void;
  onDelete?: () => void;
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

  useClickOutside(cancel, ["click"], [editorRow, actionsRow]);

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
      form.setFieldValue(field, toAmountString(value));
    }
  }

  function amountInputProps(field: AmountField) {
    return {
      value: form.values[field],
      onChange: (value: Amount) => setAmount(field, value),
      onBlur: () => formatAmount(field),
      error: Boolean(form.errors.amount),
      autoFocus: focusField === field,
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
            autoFocus={focusField === "occurredOn"}
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
              autoFocus={focusField === "accountId"}
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
            autoFocus={focusField === "description"}
            {...form.getInputProps("description")}
          />
        </Table.Td>
        <Table.Td>
          <MoneyInput
            aria-label="Outflow"
            size="xs"
            {...amountInputProps("outflow")}
          />
        </Table.Td>
        <Table.Td>
          <MoneyInput
            aria-label="Inflow"
            size="xs"
            {...amountInputProps("inflow")}
          />
        </Table.Td>
      </Table.Tr>
      <Table.Tr
        ref={setActionsRow}
        className={classes.editorRow}
        onKeyDown={cancelOnEscape}
      >
        <Table.Td colSpan={COLUMN_COUNT}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              {onDelete && (
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={onDelete}
                  disabled={mutation.isPending}
                >
                  Delete
                </Button>
              )}
              <ErrorMessages messages={messages} />
            </Group>
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
                disabled={mutation.isPending}
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
