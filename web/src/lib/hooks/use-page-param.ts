import { useSearchParams } from "react-router-dom";
import { parsePage } from "@/lib/api/pagination";

function withoutPage(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  next.delete("page");
  return next;
}

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const otherParams = withoutPage(searchParams).toString();
  const searchWithoutPage = otherParams === "" ? "" : `?${otherParams}`;

  function goToPage(nextPage: number) {
    setSearchParams((current) => {
      const next = withoutPage(current);
      if (nextPage !== 1) {
        next.set("page", String(nextPage));
      }
      return next;
    });
    window.scrollTo({ top: 0 });
  }

  return { page, goToPage, searchWithoutPage };
}
