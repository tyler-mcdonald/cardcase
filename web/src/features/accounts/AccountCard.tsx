import { Badge, Card, Text } from "@mantine/core";
import clsx from "clsx";
import classes from "./AccountCard.module.css";
import type { Account } from "./api";
import { formatExpiry, isExpired } from "./format";

const TYPE_LABEL: Record<Account["type"], string> = {
  gift_card: "Gift card",
  flight_credit: "Flight credit",
};

const ART_CLASS: Record<Account["type"], string> = {
  gift_card: classes.artGiftCard,
  flight_credit: classes.artFlightCredit,
};

export function AccountCard({ account }: { account: Account }) {
  const expired = account.expires_on ? isExpired(account.expires_on) : false;

  return (
    <Card radius="lg" p="md" withBorder className={classes.card}>
      <AccountArt account={account} />
      <div aria-hidden className={classes.scrim} />
      <Badge
        variant="light"
        radius="xl"
        size="sm"
        className={classes.typeBadge}
      >
        {TYPE_LABEL[account.type]}
      </Badge>
      <div className={classes.footerRow}>
        <div className={classes.nameColumn}>
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
  return (
    <div aria-hidden className={clsx(classes.art, ART_CLASS[account.type])}>
      {account.type === "flight_credit" ? (
        <FlightCreditIcon />
      ) : (
        <Monogram letter={account.name.charAt(0).toUpperCase()} />
      )}
    </div>
  );
}

function FlightCreditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={64}
      height={64}
      fill="none"
      stroke="var(--mantine-color-violet-light-color)"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classes.planeIcon}
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function Monogram({ letter }: { letter: string }) {
  return (
    <Text
      fw={700}
      fz={42}
      c="var(--mantine-color-gray-light-color)"
      className={classes.monogram}
    >
      {letter}
    </Text>
  );
}
