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

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const firstPageParams = paramsForPage(searchParams, 1).toString();
  const searchWithoutPage = firstPageParams === "" ? "" : `?${firstPageParams}`;

  function goToPage(nextPage: number) {
    setSearchParams((current) => paramsForPage(current, nextPage));
    window.scrollTo({ top: 0 });
  }

  return { page, goToPage, searchWithoutPage };
}
