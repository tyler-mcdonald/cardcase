import { Navigate, useSearchParams } from "react-router-dom";
import { firstPageSearch } from "@/lib/hooks/use-page-param";

// Replaces the current location with page 1, keeping every other param.
export function FirstPageRedirect() {
  const [searchParams] = useSearchParams();
  return <Navigate to={{ search: firstPageSearch(searchParams) }} replace />;
}
