import { Pagination } from "@mantine/core";
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
  if (total <= 1) {
    return null;
  }
  return (
    <Pagination
      total={total}
      value={page}
      onChange={onChange}
      disabled={disabled}
      className={classes.pagination}
    />
  );
}
