import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.test.local", quiet: true });

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Integration tests need a disposable Neon branch (see AGENTS.md); they never use DATABASE_URL."
  );
}

process.env.DATABASE_URL = url;
process.env.DATABASE_URL_UNPOOLED = url;
process.env.NEXTAUTH_SECRET = "integration-test-secret-0123456789abcdef";

const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
  headers: async () => new Headers(),
}));

export { cookieJar };
