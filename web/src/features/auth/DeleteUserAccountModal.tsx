import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FormError } from "@/components/FormError";
import { apiErrorMessage } from "@/lib/api/errors";
import { useGuardedClose } from "@/lib/hooks/use-guarded-close";
import { useDeleteUserAccount } from "./queries";

const PHRASE_PREFIX = "delete account ";

function confirmationPhrase(email: string) {
  return `${PHRASE_PREFIX}${email}`;
}

function matchesPhrase(input: string, email: string) {
  const value = input.trim();
  return (
    value.startsWith(PHRASE_PREFIX) &&
    value.slice(PHRASE_PREFIX.length).trim().toLowerCase() ===
      email.toLowerCase()
  );
}

function blockInsert(event: SyntheticEvent) {
  event.preventDefault();
}

export function DeleteUserAccountModal({
  email,
  opened,
  onClose,
}: {
  email: string;
  opened: boolean;
  onClose: () => void;
}) {
  const deleteUserAccount = useDeleteUserAccount();
  const close = useGuardedClose([deleteUserAccount], onClose);

  return (
    <Modal opened={opened} onClose={close} title="Delete your account?">
      <DeleteUserAccountContent
        email={email}
        deleteUserAccount={deleteUserAccount}
        close={close}
      />
    </Modal>
  );
}

function DeleteUserAccountContent({
  email,
  deleteUserAccount,
  close,
}: {
  email: string;
  deleteUserAccount: ReturnType<typeof useDeleteUserAccount>;
  close: () => void;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const phrase = confirmationPhrase(email);
  const confirmed = matchesPhrase(input, email);

  function submit(event: SyntheticEvent) {
    event.preventDefault();
    if (!confirmed) {
      return;
    }
    deleteUserAccount.mutate(undefined, {
      onSuccess: () => navigate("/login", { replace: true }),
    });
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <Text size="sm">
          This permanently deletes your account and all of your accounts and
          transactions. You can't undo this.
        </Text>
        <TextInput
          label={
            <>
              Type <strong>{phrase}</strong> to confirm
            </>
          }
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onPaste={blockInsert}
          onDrop={blockInsert}
          autoComplete="off"
          spellCheck={false}
          data-autofocus
        />
        {deleteUserAccount.error && (
          <FormError message={apiErrorMessage(deleteUserAccount.error)} />
        )}
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={close}
            disabled={deleteUserAccount.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="red"
            disabled={!confirmed}
            loading={deleteUserAccount.isPending}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
