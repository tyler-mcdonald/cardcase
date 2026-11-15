import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parsePage } from "@/lib/api/pagination";

export function paramsForPage(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.delete("page");
  if (page !== 1) {
    next.set("page", String(page));
  }
  return next;
}

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  function goToPage(nextPage: number) {
    setSearchParams((current) => paramsForPage(current, nextPage));
    window.scrollTo({ top: 0 });
  }

  // Swaps the current history entry for page 1, keeping every other param.
  const replaceWithFirstPage = useCallback(() => {
    setSearchParams((current) => paramsForPage(current, 1), { replace: true });
  }, [setSearchParams]);

  return { page, goToPage, replaceWithFirstPage };
}
