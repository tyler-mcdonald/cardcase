import { useRef, useState, type FormEvent } from "react";
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
import { useAuth } from "@/lib/use-auth";

export function LoginForm() {
  const { requestLoginCode, confirmLoginCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(
    event: FormEvent,
    action: () => ReturnType<typeof requestLoginCode>,
    onSuccess?: () => void,
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
    }
  }

  const handleRequestCode = (event: FormEvent) =>
    submit(
      event,
      () => requestLoginCode(email),
      () => setStep("code"),
    );

  const handleConfirmCode = (event: FormEvent) =>
    submit(event, () => confirmLoginCode(code));

  // Set on the paste-capture phase (fires before PinInput's own paste
  // handling) so handleCodeChange can tell a pasted replacement apart
  // from overtyping a filled box — both produce a same-length string.
  const codeWasPasted = useRef(false);

  function handleCodeChange(value: string) {
    const pasted = codeWasPasted.current;
    codeWasPasted.current = false;
    // Once all 6 digits are filled, typing over the last box replaces it
    // in place rather than growing the string, so length alone can't cap
    // entry — only block same-length updates from typing (overtyping);
    // deletions always shrink the string, and pasting a full replacement
    // code stays allowed either way.
    if (!pasted && code.length === 6 && value.length === 6) {
      return;
    }
    setCode(value);
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
            onCodeChange={handleCodeChange}
            onCodePasteCapture={() => {
              codeWasPasted.current = true;
            }}
            onSubmit={handleConfirmCode}
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
  onCodePasteCapture,
  onSubmit,
  submitting,
}: {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onCodePasteCapture: () => void;
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
          value={code}
          onChange={onCodeChange}
          onPasteCapture={onCodePasteCapture}
        />
        <Button
          type="submit"
          loading={submitting}
          disabled={code.length !== 6}
          fullWidth
        >
          Confirm
        </Button>
      </Stack>
    </form>
  );
}
