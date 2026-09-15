import { Badge, Card, Text } from "@mantine/core";
import type { Account } from "./api";
import { formatExpiry, isExpired } from "./format";

const TYPE_LABEL: Record<Account["type"], string> = {
  gift_card: "Gift card",
  flight_credit: "Flight credit",
};

const ART_BACKGROUND: Record<Account["type"], string> = {
  gift_card: "var(--mantine-color-gray-light)",
  flight_credit: "var(--mantine-color-violet-light)",
};

const CARD_STYLE = {
  aspectRatio: "1.65 / 1",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  overflow: "hidden",
  position: "relative",
  color: "white",
} as const;

const ART_STYLE = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

const SCRIM_STYLE = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0) 62%)",
} as const;

const TYPE_BADGE_STYLE = {
  position: "relative",
  alignSelf: "flex-start",
  background: "rgba(255,255,255,0.22)",
  color: "white",
} as const;

const FOOTER_ROW_STYLE = {
  position: "relative",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 8,
} as const;

const NAME_COLUMN_STYLE = { minWidth: 0 } as const;

const PLANE_ICON_STYLE = { opacity: 0.5 } as const;
const MONOGRAM_STYLE = { opacity: 0.35 } as const;

export function AccountCard({ account }: { account: Account }) {
  const expired = account.expires_on ? isExpired(account.expires_on) : false;

  return (
    <Card radius="lg" p="md" withBorder style={CARD_STYLE}>
      <AccountArt account={account} />
      <div aria-hidden style={SCRIM_STYLE} />
      <Badge variant="light" radius="xl" size="sm" style={TYPE_BADGE_STYLE}>
        {TYPE_LABEL[account.type]}
      </Badge>
      <div style={FOOTER_ROW_STYLE}>
        <div style={NAME_COLUMN_STYLE}>
          <Text fw={700} size="sm" truncate c="white">
            {account.name}
          </Text>
          {expired ? (
            <Badge color="red" variant="filled" size="xs" radius="xl" mt={4}>
              {formatExpiry(account.expires_on, expired)}
            </Badge>
          ) : (
            <Text size="xs" c="rgba(255,255,255,0.78)">
              {formatExpiry(account.expires_on, expired)}
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
  const style = {
    ...ART_STYLE,
    backgroundColor: ART_BACKGROUND[account.type],
  };

  return (
    <div aria-hidden style={style}>
      {account.type === "flight_credit" ? (
        <svg
          viewBox="0 0 24 24"
          width={64}
          height={64}
          fill="none"
          stroke="var(--mantine-color-violet-light-color)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={PLANE_ICON_STYLE}
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
      ) : (
        <Text
          fw={700}
          fz={42}
          c="var(--mantine-color-gray-light-color)"
          style={MONOGRAM_STYLE}
        >
          {account.name.charAt(0).toUpperCase()}
        </Text>
      )}
    </div>
  );
}
