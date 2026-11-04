import { describe, expect, it } from "vitest";
import { endpoint, v1 } from "@/lib/api/endpoints";

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

describe("v1", () => {
  it("builds versioned API paths", () => {
    expect(v1.path("accounts")({ page: 1 })).toBe("/v1/accounts?page=1");
  });
});
