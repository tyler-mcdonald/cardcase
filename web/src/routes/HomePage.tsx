import { useAuth } from "@/lib/use-auth";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Hello, {user?.email}</h1>
      <button onClick={() => logout()}>Log out</button>
    </main>
  );
}
