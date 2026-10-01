import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { isMissingPage, parsePage, totalPages } from "@/lib/api/pagination";

describe("parsePage", () => {
  it("returns a positive integer page", () => {
    expect(parsePage("3")).toBe(3);
  });

  it.each([null, "", "0", "-2", "1.5", "abc"])(
    "falls back to page 1 for %j",
    (value) => {
      expect(parsePage(value)).toBe(1);
    },
  );
});

describe("totalPages", () => {
  it("derives the page count from the first page's size when more pages follow", () => {
    const response = {
      count: 25,
      next: "/next",
      previous: null,
      results: Array.from({ length: 10 }, () => ({})),
    };

    expect(totalPages(response, 1)).toBe(3);
  });

  it("treats the current page as the last when no pages follow", () => {
    const response = {
      count: 25,
      next: null,
      previous: "/previous",
      results: Array.from({ length: 5 }, () => ({})),
    };

    expect(totalPages(response, 3)).toBe(3);
  });
});

describe("isMissingPage", () => {
  it("returns true for a 404 API error", () => {
    expect(isMissingPage(new ApiError("Not found", 404))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isMissingPage(new ApiError("Server error", 500))).toBe(false);
  });
});
