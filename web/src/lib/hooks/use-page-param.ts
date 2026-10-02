import { useSearchParams } from "react-router-dom";
import { parsePage } from "@/lib/api/pagination";

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    window.scrollTo({ top: 0 });
  }

  return { page, goToPage };
}
