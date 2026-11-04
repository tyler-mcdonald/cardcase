import { describe, expect, it } from "vitest";
import { accounts, endpoint, transactions } from "@/lib/api/endpoints";

describe("endpoint", () => {
  it("returns the base path without params", () => {
    expect(endpoint("/base")()).toBe("/base");
  });

  it("appends query params", () => {
    expect(endpoint("/base")({ page: 2, active: true, q: "a b" })).toBe(
      "/base?page=2&active=true&q=a+b",
    );
  });

  it("omits undefined params", () => {
    expect(endpoint("/base")({ page: undefined })).toBe("/base");
  });

  it("layers path segments onto the base", () => {
    expect(endpoint("/base").path("items", 42).path("children")()).toBe(
      "/base/items/42/children",
    );
  });

  it("encodes path segments", () => {
    expect(endpoint("/base").path("a/b?c")()).toBe("/base/a%2Fb%3Fc");
  });
});

describe("API endpoints", () => {
  it("builds versioned resource paths", () => {
    expect(accounts({ page: 1 })).toBe("/v1/accounts?page=1");
    expect(transactions()).toBe("/v1/transactions");
  });
});
