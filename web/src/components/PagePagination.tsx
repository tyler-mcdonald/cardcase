import { Pagination } from "@mantine/core";
import classes from "./PagePagination.module.css";

export function PagePagination({
  total,
  page,
  onChange,
}: {
  total: number;
  page: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) {
    return null;
  }
  return (
    <Pagination
      total={total}
      value={page}
      onChange={onChange}
      className={classes.pagination}
    />
  );
}
