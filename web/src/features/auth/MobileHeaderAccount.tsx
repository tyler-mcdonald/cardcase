import { useAuth } from "./use-auth";
import { UserMenu } from "./UserMenu";

export function MobileHeaderAccount() {
  const { user } = useAuth();

  return <UserMenu email={user?.email ?? ""} />;
}
