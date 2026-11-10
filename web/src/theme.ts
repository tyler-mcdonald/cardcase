import { createTheme, Modal } from "@mantine/core";
import classes from "./theme.module.css";

export const theme = createTheme({
  components: {
    Modal: Modal.extend({
      classNames: {
        inner: classes.modalInner,
        content: classes.modalContent,
      },
    }),
  },
});
