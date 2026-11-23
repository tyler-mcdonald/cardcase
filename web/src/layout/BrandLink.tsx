import { Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/constants";

export function BrandLink() {
  return (
    <Anchor
      component={Link}
      to="/"
      fw={700}
      size="lg"
      c="inherit"
      underline="never"
    >
      {APP_NAME}
    </Anchor>
  );
}
