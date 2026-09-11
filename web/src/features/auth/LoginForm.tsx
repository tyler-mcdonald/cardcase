import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Paper,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAuth, PROCESS_EXPIRED, type ActionResult } from "@/lib/use-auth";

export function LoginForm() {
  const { requestLoginCode, confirmLoginCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(
    event: FormEvent,
    {
      action,
      onSuccess,
      onFailure,
    }: {
      action: () => ReturnType<typeof requestLoginCode>;
      onSuccess?: () => void;
      onFailure?: (result: Extract<ActionResult, { ok: false }>) => void;
    },
  ) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await action();
    setSubmitting(false);
    if (result.ok) {
      onSuccess?.();
    } else {
      setError(result.error);
      onFailure?.(result);
    }
  }

  const handleRequestCode = (event: FormEvent) =>
    submit(event, {
      action: () => requestLoginCode(email),
      onSuccess: () => setStep("code"),
    });

  const handleConfirmCode = (event: FormEvent) =>
    submit(event, {
      action: () => confirmLoginCode(code),
      onFailure: (result) => {
        if (result.code === PROCESS_EXPIRED) {
          setStep("email");
          setCode("");
          setError(
            "Your code expired or was entered incorrectly too many times. Please request a new one.",
          );
        }
      },
    });

  function handleStartOver() {
    setStep("email");
    setCode("");
    setError(null);
  }

  return (
    <main>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Title order={1} ta="center" mb="lg">
          Log in
        </Title>
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
            onStartOver={handleStartOver}
            submitting={submitting}
          />
        )}
        {error && (
          <Alert color="red" mt="md" role="alert">
            {error}
          </Alert>
        )}
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
      <Stack>
        <TextInput
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        <Button type="submit" loading={submitting} fullWidth>
          Send login code
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
  onStartOver,
  submitting,
}: {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: (event: FormEvent) => void;
  onStartOver: () => void;
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
          value={code}
          onChange={onCodeChange}
        />
        <Button
          type="submit"
          loading={submitting}
          disabled={code.length !== 6}
          fullWidth
        >
          Confirm
        </Button>
        <Button type="button" variant="subtle" size="sm" onClick={onStartOver}>
          Use a different email
        </Button>
      </Stack>
    </form>
  );
}
