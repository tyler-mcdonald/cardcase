import { Badge, Card, Skeleton, Text, UnstyledButton } from "@mantine/core";
import classes from "./AccountCard.module.css";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { Account } from "./types";
import { describeBalance, describeExpiry } from "./format";

type AccountStyle = {
  artClass: string;
  emoji: string;
  accountNameClass: string;
};

const ACCOUNT_STYLE: Record<Account["type"], AccountStyle> = {
  gift_card: {
    artClass: classes.artGiftCard,
    emoji: "🎁",
    accountNameClass: classes.nameGiftCard,
  },
  flight_credit: {
    artClass: classes.artFlightCredit,
    emoji: "✈️",
    accountNameClass: classes.nameFlightCredit,
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
      <div aria-hidden className={`${classes.art} ${style.artClass}`} />
      <div aria-hidden className={classes.scrim} />
      <div className={classes.headerRow}>
        <span
          role="img"
          aria-label={ACCOUNT_TYPE_DISPLAY[account.type].label}
          className={classes.typeEmoji}
        >
          {style.emoji}
        </span>
      </div>
      <div className={classes.nameRow}>
        <Text
          fw={700}
          fz="xl"
          lh={1.15}
          lineClamp={account.description ? 1 : 2}
          ta="center"
          w="100%"
          className={style.accountNameClass}
        >
          {account.name}
        </Text>
        {account.description && (
          <Text
            size="sm"
            lh={1.3}
            ta="center"
            w="100%"
            className={`${style.accountNameClass} ${classes.description}`}
          >
            {account.description}
          </Text>
        )}
      </div>
      <div className={classes.footerRow}>
        {expiry.expired ? (
          <Badge color="red" variant="filled" size="xs" radius="xl">
            {expiry.label}
          </Badge>
        ) : (
          <Text size="xs" className={classes.expiry}>
            {expiry.label}
          </Text>
        )}
        <Text
          fw={700}
          size="lg"
          className={classes.balance}
          data-negative={balance.negative || undefined}
        >
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
