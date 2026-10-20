import { useState, type FormEvent } from "react";
import {
  Button,
  Paper,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { FormError } from "@/components/FormError";
import { apiErrorMessage } from "@/lib/api/errors";
import { useConfirmLoginCode, useRequestLoginCode } from "./queries";

export function LoginForm() {
  const requestLoginCode = useRequestLoginCode();
  const confirmLoginCode = useConfirmLoginCode();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    requestLoginCode.mutate(email, { onSuccess: () => setStep("code") });
  }

  function handleConfirmCode(event: FormEvent) {
    event.preventDefault();
    confirmLoginCode.mutate(code);
  }

  const submitting = requestLoginCode.isPending || confirmLoginCode.isPending;
  const error = requestLoginCode.error ?? confirmLoginCode.error;

  return (
    <main>
      <Stack gap="xs" align="center" mb="xl">
        <Title order={1} ta="center">
          cardcase
        </Title>
        <Text c="gray.7" ta="center">
          Store and track gift cards, flight credits, and other cash-like
          accounts.
        </Text>
      </Stack>
      <Paper withBorder p="xl" radius="md">
        {step === "email" ? (
          <EmailStep
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleRequestCode}
            submitting={submitting}
          />
        ) : (
          <CodeStep
            email={email}
            code={code}
            onCodeChange={setCode}
            onSubmit={handleConfirmCode}
            submitting={submitting}
          />
        )}
        {error && <FormError mt="md" message={apiErrorMessage(error)} />}
      </Paper>
    </main>
  );
}

function EmailStep({
  email,
  onEmailChange,
  onSubmit,
  submitting,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent) => void;
  submitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <Stack gap="sm">
        <TextInput
          id="email"
          aria-label="Email"
          placeholder="Enter your email"
          size="md"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        <Button type="submit" size="md" fz="sm" loading={submitting} fullWidth>
          Continue with email
        </Button>
      </Stack>
    </form>
  );
}

function CodeStep({
  email,
  code,
  onCodeChange,
  onSubmit,
  submitting,
}: {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: (event: FormEvent) => void;
  submitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <Stack align="center">
        <Text size="sm" ta="center">
          Enter the code sent to {email}
        </Text>
        <PinInput
          id="code"
          ariaLabel="Code"
          length={6}
          type="number"
          placeholder=""
          autoFocus
          disabled={submitting}
          value={code}
          onChange={onCodeChange}
        />
        <Button
          type="submit"
          size="md"
          fz="sm"
          loading={submitting}
          disabled={code.length !== 6 || submitting}
          fullWidth
        >
          Confirm
        </Button>
      </Stack>
    </form>
  );
}
