import { useSearchParams } from "react-router-dom";
import { parsePage } from "@/lib/api/pagination";

function paramsForPage(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.delete("page");
  if (page !== 1) {
    next.set("page", String(page));
  }
  return next;
}

// The location search string for page 1, keeping every other param.
export function firstPageSearch(params: URLSearchParams): string {
  const search = paramsForPage(params, 1).toString();
  return search === "" ? "" : `?${search}`;
}

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  function goToPage(nextPage: number) {
    setSearchParams((current) => paramsForPage(current, nextPage));
    window.scrollTo({ top: 0 });
  }

  return { page, goToPage, firstPageSearch: firstPageSearch(searchParams) };
}
