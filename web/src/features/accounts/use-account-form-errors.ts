import { useMemo } from "react";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api/errors";
import { ACCOUNT_INPUT_FIELDS } from "./constants";

function inputFieldErrors(error: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(apiFieldErrors(error)).filter(([field]) =>
      Object.hasOwn(ACCOUNT_INPUT_FIELDS, field),
    ),
  );
}

export function useAccountFormErrors(error: Error | null) {
  return useMemo(() => {
    const fieldErrors = inputFieldErrors(error);
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    return {
      fieldErrors,
      formError: error && !hasFieldErrors ? apiErrorMessage(error) : null,
    };
  }, [error]);
}
