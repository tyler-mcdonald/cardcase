// Turns an account form mutation error into what AccountForm displays: a
// message under each field the API rejected, or a single form-level message
// when the error isn't about a specific field.

import { useMemo } from "react";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api/errors";
import type { AccountInput } from "./types";

const FORM_FIELDS = [
  "name",
  "type",
  "expires_on",
  "description",
] as const satisfies readonly (keyof AccountInput)[];

export function useAccountFormErrors(error: Error | null) {
  return useMemo(() => {
    const fieldErrors = apiFieldErrors(error, FORM_FIELDS);
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    const formError = error && !hasFieldErrors ? apiErrorMessage(error) : null;
    return { fieldErrors, formError };
  }, [error]);
}
