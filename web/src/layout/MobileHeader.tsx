import { Group } from "@mantine/core";
import { MobileHeaderAccount } from "@/features/auth/MobileHeaderAccount";
import { BrandLink } from "./BrandLink";
import classes from "./MobileLayout.module.css";

export function MobileHeader() {
  return (
    <Group justify="space-between" className={classes.header}>
      <BrandLink />
      <MobileHeaderAccount />
    </Group>
  );
}
