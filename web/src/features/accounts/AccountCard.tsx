import { Badge, Card, Text } from "@mantine/core";
import type { Account } from "./api";
import { formatExpiry, isExpired } from "./format";

const TYPE_LABEL: Record<Account["type"], string> = {
  gift_card: "Gift card",
  flight_credit: "Flight credit",
};

export function AccountCard({ account }: { account: Account }) {
  const expired = account.expires_on ? isExpired(account.expires_on) : false;

  return (
    <Card
      radius="lg"
      p="md"
      withBorder
      style={{
        aspectRatio: "1.65 / 1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        color: "white",
      }}
    >
      <AccountArt account={account} />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0) 62%)",
        }}
      />
      <Badge
        variant="light"
        radius="xl"
        size="sm"
        style={{
          position: "relative",
          alignSelf: "flex-start",
          background: "rgba(255,255,255,0.22)",
          color: "white",
        }}
      >
        {TYPE_LABEL[account.type]}
      </Badge>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Text fw={700} size="sm" truncate c="white">
            {account.name}
          </Text>
          {expired ? (
            <Badge color="red" variant="filled" size="xs" radius="xl" mt={4}>
              {formatExpiry(account.expires_on)}
            </Badge>
          ) : (
            <Text size="xs" c="rgba(255,255,255,0.78)">
              {formatExpiry(account.expires_on)}
            </Text>
          )}
        </div>
        <Text
          fw={700}
          size="lg"
          c="rgba(255,255,255,0.55)"
          aria-label="Balance tracking isn't available yet"
        >
          —
        </Text>
      </div>
    </Card>
  );
}

function AccountArt({ account }: { account: Account }) {
  if (account.type === "flight_credit") {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--mantine-color-violet-light)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={64}
          height={64}
          fill="none"
          stroke="var(--mantine-color-violet-light-color)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.5 }}
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--mantine-color-gray-light)",
      }}
    >
      <Text
        fw={700}
        fz={42}
        c="var(--mantine-color-gray-light-color)"
        style={{ opacity: 0.35 }}
      >
        {account.name.charAt(0).toUpperCase()}
      </Text>
    </div>
  );
}
