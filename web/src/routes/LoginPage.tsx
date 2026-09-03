import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/use-auth";
import { LoginForm } from "@/features/auth/LoginForm";

export function LoginPage() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
}
