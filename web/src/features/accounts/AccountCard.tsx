import type { ReactNode } from "react";
import { Badge, Card, Skeleton, Text, UnstyledButton } from "@mantine/core";
import classes from "./AccountCard.module.css";
import type { Account } from "./types";
import { AccountTypeBadge } from "./AccountTypeBadge";
import { describeBalance, describeExpiry } from "./format";

type AccountStyle = {
  artClass: string;
  renderArt: (account: Account) => ReactNode;
};

const ACCOUNT_STYLE: Record<Account["type"], AccountStyle> = {
  gift_card: {
    artClass: classes.artGiftCard,
    renderArt: (account) => (
      <Monogram letter={account.name.charAt(0).toUpperCase()} />
    ),
  },
  flight_credit: {
    artClass: classes.artFlightCredit,
    renderArt: () => <FlightCreditIcon />,
  },
};

export function AccountCard({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: () => void;
}) {
  const style = ACCOUNT_STYLE[account.type];
  const expiry = describeExpiry(account.expires_on);
  const balance = describeBalance(account.balance);

  return (
    <Card radius="lg" p="md" withBorder className={classes.card}>
      <div aria-hidden className={`${classes.art} ${style.artClass}`}>
        {style.renderArt(account)}
      </div>
      <div aria-hidden className={classes.scrim} />
      <div className={classes.headerRow}>
        <AccountTypeBadge type={account.type} className={classes.typeBadge} />
      </div>
      <div className={classes.footerRow}>
        <div className={classes.nameColumn}>
          <Text fw={700} size="sm" truncate c="white">
            {account.name}
          </Text>
          {expiry.expired ? (
            <Badge color="red" variant="filled" size="xs" radius="xl" mt={4}>
              {expiry.label}
            </Badge>
          ) : (
            <Text size="xs" c="rgba(255,255,255,0.78)">
              {expiry.label}
            </Text>
          )}
        </div>
        <Text fw={700} size="lg" c={balance.negative ? "red.4" : "white"}>
          {balance.label}
        </Text>
      </div>
      <UnstyledButton
        aria-label={`Edit ${account.name}`}
        className={classes.cardButton}
        onClick={onEdit}
      />
    </Card>
  );
}

export function AccountCardSkeleton() {
  return <Skeleton radius="lg" className={classes.card} />;
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
