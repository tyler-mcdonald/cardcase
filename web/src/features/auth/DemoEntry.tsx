import { useEffect, useRef } from "react";
import { Anchor, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FormError } from "@/components/FormError";
import { apiErrorMessage, GENERIC_ERROR, hasApiStatus } from "@/lib/api/errors";
import { useLogout, useStartDemo } from "./queries";
import { useAuth } from "./use-auth";

const THROTTLED_ERROR =
  "You have started too many demo sessions. Please try again later.";

export function DemoEntry() {
  const { user } = useAuth();

  if (user === undefined) {
    return null;
  }

  if (user?.is_demo) {
    return <Navigate to="/" replace />;
  }

  if (user) {
    return <SignOutConfirmation />;
  }

  return <StartDemo />;
}

function StartDemo() {
  const { mutate, error, isSuccess } = useStartDemo();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    mutate();
  }, [mutate]);

  if (error || isSuccess) {
    const message = hasApiStatus(error, 429) ? THROTTLED_ERROR : GENERIC_ERROR;
    return (
      <Stack align="center">
        <FormError message={message} w="100%" />
        <Anchor component={Link} to="/login" size="sm">
          Back to login
        </Anchor>
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="sm">
      <Loader aria-label="Starting the demo" />
      <Text size="sm" c="dimmed">
        Starting the demo…
      </Text>
    </Stack>
  );
}

function SignOutConfirmation() {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <Stack>
      <Text ta="center">
        Starting the demo will sign you out of your account.
      </Text>
      {logout.error && <FormError message={apiErrorMessage(logout.error)} />}
      <Group justify="center">
        <Button
          variant="default"
          onClick={() => navigate("/", { replace: true })}
          disabled={logout.isPending}
        >
          Stay signed in
        </Button>
        <Button onClick={() => logout.mutate()} loading={logout.isPending}>
          Sign out and start demo
        </Button>
      </Group>
    </Stack>
  );
}
