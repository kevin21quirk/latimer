import { afterEach, describe, expect, it, vi } from "vitest";

describe("getAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws when NEXTAUTH_SECRET is missing instead of falling back", async () => {
    vi.stubEnv("NEXTAUTH_SECRET", "");
    const { getAuthSecret } = await import("./auth-secret");
    expect(() => getAuthSecret()).toThrow("NEXTAUTH_SECRET is not set");
  });

  it("encodes the configured secret", async () => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
    const { getAuthSecret } = await import("./auth-secret");
    expect(new TextDecoder().decode(getAuthSecret())).toBe("test-secret");
  });
});
