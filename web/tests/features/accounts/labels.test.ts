import { describe, expect, it } from "vitest";
import {
  accountLabeler,
  accountLabels,
  accountLabelText,
} from "@/features/accounts/labels";
import { makeAccount } from "@tests/features/accounts/factories";

describe("accountLabels", () => {
  it("labels an account with a unique name by its name alone", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Target", description: "Birthday" }),
      makeAccount({ id: "b", name: "Delta" }),
    ]);

    expect(labels.get("a")).toEqual({ name: "Target" });
    expect(labels.get("b")).toEqual({ name: "Delta" });
  });

  it("shows the same field for every same-name account", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Southwest", description: "Chase Visa" }),
      makeAccount({ id: "b", name: "Southwest", expires_on: "2027-03-14" }),
      makeAccount({ id: "c", name: "Southwest", balance: "89.5" }),
    ]);

    expect(labels.get("a")).toEqual({
      name: "Southwest",
      detail: "Chase Visa",
    });
    expect(labels.get("b")).toEqual({ name: "Southwest" });
    expect(labels.get("c")).toEqual({ name: "Southwest" });
  });

  it("uses the expiry when no same-name account has a description", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Starbucks", expires_on: "2027-03-14" }),
      makeAccount({ id: "b", name: "Starbucks" }),
    ]);

    expect(labels.get("a")).toEqual({
      name: "Starbucks",
      detail: "Expires Mar 14, 2027",
    });
    expect(labels.get("b")).toEqual({ name: "Starbucks" });
  });

  it("skips a field that every same-name account shares", () => {
    const labels = accountLabels([
      makeAccount({
        id: "a",
        name: "Southwest",
        description: "Chase Visa",
        expires_on: "2027-03-14",
      }),
      makeAccount({ id: "b", name: "Southwest", description: "Chase Visa" }),
    ]);

    expect(labels.get("a")?.detail).toBe("Expires Mar 14, 2027");
    expect(labels.get("b")?.detail).toBeUndefined();
  });

  it("falls back to the balance", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Southwest", balance: "89.5" }),
      makeAccount({ id: "b", name: "Southwest", balance: "10" }),
    ]);

    expect(labels.get("a")?.detail).toBe("$89.50");
    expect(labels.get("b")?.detail).toBe("$10.00");
  });

  it("matches names ignoring case, surrounding whitespace, and type", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Amazon", type: "gift_card" }),
      makeAccount({ id: "b", name: " amazon ", type: "flight_credit" }),
    ]);

    expect(labels.get("a")?.detail).toBe("$0.00");
    expect(labels.get("b")?.detail).toBe("$0.00");
  });

  it("cuts a long description and keeps the full one", () => {
    const description = "Chase Visa companion credit from Feb trip";
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Southwest", description }),
      makeAccount({ id: "b", name: "Southwest" }),
    ]);

    expect(labels.get("a")).toEqual({
      name: "Southwest",
      detail: "Chase Visa companion credit fr…",
      fullDescription: description,
    });
  });

  it("collapses line breaks in the description", () => {
    const labels = accountLabels([
      makeAccount({
        id: "a",
        name: "Southwest",
        description: "Chase\n\nVisa ",
      }),
      makeAccount({ id: "b", name: "Southwest" }),
    ]);

    expect(labels.get("a")?.detail).toBe("Chase Visa");
  });

  it("falls back past a whitespace-only description", () => {
    const labels = accountLabels([
      makeAccount({ id: "a", name: "Southwest", description: " \n " }),
      makeAccount({ id: "b", name: "Southwest" }),
    ]);

    expect(labels.get("a")?.detail).toBe("$0.00");
  });
});

describe("accountLabeler", () => {
  it("falls back to the given name for an unknown account", () => {
    const label = accountLabeler(undefined);

    expect(label({ id: "a", name: "Starbucks" })).toEqual({
      name: "Starbucks",
    });
  });
});

describe("accountLabelText", () => {
  it("puts the detail in parentheses after the name", () => {
    expect(accountLabelText({ name: "Southwest", detail: "Chase Visa" })).toBe(
      "Southwest (Chase Visa)",
    );
    expect(accountLabelText({ name: "Delta" })).toBe("Delta");
  });
});
