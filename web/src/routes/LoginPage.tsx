import { Navigate } from "react-router-dom";
import { Container } from "@mantine/core";
import { useAuth } from "@/features/auth/use-auth";
import { LoginForm } from "@/features/auth/LoginForm";

export function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container size={420} pt="15vh">
      <LoginForm />
    </Container>
  );
}
