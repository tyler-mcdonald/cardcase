import { Navigate } from "react-router-dom";
import { Container } from "@mantine/core";
import { useAuth } from "@/lib/use-auth";
import { LoginForm } from "@/features/auth/LoginForm";

export function LoginPage() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <Container size={420} pt="15vh">
      <LoginForm />
    </Container>
  );
}
