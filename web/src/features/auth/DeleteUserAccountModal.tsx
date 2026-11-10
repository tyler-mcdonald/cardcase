import { Code, Modal, TextInput } from "@mantine/core";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
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
      <DeleteUserAccountForm
        email={email}
        deleteUserAccount={deleteUserAccount}
        close={close}
      />
    </Modal>
  );
}

function DeleteUserAccountForm({
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

  function submit() {
    if (!confirmed || deleteUserAccount.isPending) {
      return;
    }
    deleteUserAccount.mutate(undefined, {
      onSuccess: () => navigate("/login", { replace: true }),
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <DeleteConfirmation
        message="This permanently deletes your account and all of your accounts and transactions. You can't undo this."
        isPending={deleteUserAccount.isPending}
        error={deleteUserAccount.error}
        onConfirm={submit}
        onCancel={close}
        confirmEnabled={confirmed}
      >
        <TextInput
          label={
            <>
              Type <Code fw={700}>{phrase}</Code> to confirm
            </>
          }
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onPaste={blockInsert}
          onDrop={blockInsert}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-autofocus
        />
      </DeleteConfirmation>
    </form>
  );
}
