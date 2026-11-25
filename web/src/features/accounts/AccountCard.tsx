import { Badge, Card, Skeleton, Text, UnstyledButton } from "@mantine/core";
import { BrandLogo } from "@/features/brands/BrandLogo";
import classes from "./AccountCard.module.css";
import { ACCOUNT_TYPE_DISPLAY } from "./constants";
import type { Account } from "./types";
import { describeBalance, describeExpiry } from "./format";

const ACCOUNT_EMOJI: Record<Account["type"], string> = {
  gift_card: "🎁",
  flight_credit: "✈️",
};

function AccountCardHeader({ account }: { account: Account }) {
  const emoji = ACCOUNT_EMOJI[account.type];

  return (
    <div className={classes.headerRow}>
      <span
        role="img"
        aria-label={ACCOUNT_TYPE_DISPLAY[account.type].label}
        className={classes.typeEmoji}
      >
        {account.brand_domain ? (
          <BrandLogo
            domain={account.brand_domain}
            size={28}
            fallback={emoji}
            className={classes.brandLogo}
          />
        ) : (
          emoji
        )}
      </span>
    </div>
  );
}

function AccountCardFooter({ account }: { account: Account }) {
  const expiry = describeExpiry(account.expires_on);
  const balance = describeBalance(account.balance);

  return (
    <div className={classes.footerRow}>
      {expiry.expired ? (
        <Badge color="red" variant="filled" size="xs" radius={2} ff="monospace">
          {expiry.label}
        </Badge>
      ) : (
        <Text ff="monospace" fz={11} className={classes.expiry}>
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
  );
}

export function AccountCard({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: () => void;
}) {
  return (
    <div className={classes.root}>
      <Card radius="md" p="md" className={classes.card}>
        <AccountCardHeader account={account} />
        <div className={classes.nameRow}>
          <Text
            fw={700}
            fz="xl"
            lh={1.15}
            lineClamp={account.description ? 1 : 2}
            ta="center"
            w="100%"
          >
            {account.name}
          </Text>
          {account.description && (
            <Text
              size="sm"
              lh={1.3}
              ta="center"
              w="100%"
              className={classes.description}
            >
              {account.description}
            </Text>
          )}
        </div>
        <AccountCardFooter account={account} />
      </Card>
      <UnstyledButton
        aria-label={`Edit ${account.name}`}
        className={classes.cardButton}
        onClick={onEdit}
      />
    </div>
  );
}

export function AccountCardSkeleton() {
  return <Skeleton radius="md" className={classes.skeleton} />;
}
