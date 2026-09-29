import { describe, expect, it } from "vitest";
import { publicDisplayName, toPublicUser } from "./projections";

describe("publicDisplayName", () => {
  it("redacts the surname to an initial", () => {
    expect(publicDisplayName({ firstName: "Sarah", lastName: "Potter" })).toBe("Sarah P.");
  });

  it("falls back to the first name when the surname is blank", () => {
    expect(publicDisplayName({ firstName: "Sarah", lastName: " " })).toBe("Sarah");
  });
});

describe("toPublicUser", () => {
  it("never exposes the full name or contact fields", () => {
    const result = toPublicUser({ id: "u1", firstName: "Sarah", lastName: "Potter" });
    expect(result).toEqual({ id: "u1", displayName: "Sarah P." });
    expect(JSON.stringify(result)).not.toContain("Potter");
  });
});
