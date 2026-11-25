import { Pagination } from "@mantine/core";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import classes from "./Pager.module.css";

export function Pager({
  total,
  page,
  onChange,
  disabled,
}: {
  total: number;
  page: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  const isMobile = useIsMobile();
  if (total <= 1) {
    return null;
  }
  return (
    <Pagination
      total={total}
      value={page}
      onChange={onChange}
      disabled={disabled}
      siblings={isMobile ? 0 : 1}
      gap={isMobile ? 2 : 8}
      className={classes.pagination}
    />
  );
}
