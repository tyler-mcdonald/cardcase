import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";

export function HomePage() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <main>
      <h1>Hello, {user?.email}</h1>
      <button onClick={() => logout.mutate()}>Log out</button>
    </main>
  );
}
