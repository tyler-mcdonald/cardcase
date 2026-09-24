import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./use-auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user === undefined) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
