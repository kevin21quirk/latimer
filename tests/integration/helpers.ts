import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import type { AccountType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { cookieJar } from "./setup";

export const runId = randomUUID().slice(0, 8);

export async function createUser(overrides: Partial<Prisma.UserCreateInput> & { accountType?: AccountType } = {}) {
  const suffix = randomUUID().slice(0, 8);
  return prisma.user.create({
    data: {
      email: `it-${runId}-${suffix}@test.invalid`,
      password: "not-a-real-hash",
      accountType: "INDIVIDUAL",
      firstName: `First${suffix}`,
      lastName: `Last${suffix}`,
      gdprConsent: true,
      ...overrides,
    },
  });
}

export async function signInAs(user: { id: string; email: string; accountType: string } | null) {
  cookieJar.clear();
  if (!user) return;
  const token = await new SignJWT({ userId: user.id, email: user.email, accountType: user.accountType })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getAuthSecret());
  cookieJar.set("auth-token", token);
}

type Handler<P> = (request: NextRequest, context: { params: Promise<P> }) => Promise<Response>;

export async function call<P = Record<string, never>>(
  handler: Handler<P>,
  { method = "GET", body, params, query = "" }: { method?: string; body?: unknown; params?: P; query?: string } = {}
) {
  const request = new NextRequest(`http://localhost/test${query}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  });
  const response = await handler(request, { params: Promise.resolve((params ?? {}) as P) });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, json: json as any, text }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function cleanupRun() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `it-${runId}-` } } });
}
