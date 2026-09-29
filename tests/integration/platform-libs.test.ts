import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, revokeAllSessions, signSessionToken } from "@/lib/auth";
import { getAuthSecret } from "@/lib/auth-secret";
import { SignJWT } from "jose";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { forbidden } from "@/lib/errors";
import { withRoute } from "@/lib/with-route";
import { call, cleanupRun, createUser, runId, signInAs } from "./helpers";

describe("rate limiting", () => {
  const key = `it-${runId}-${randomUUID().slice(0, 8)}`;

  it("allows requests up to the limit then rejects", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await checkRateLimit(key, 3, 60_000)).success).toBe(true);
    }
    const blocked = await checkRateLimit(key, 3, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks keys independently", async () => {
    const other = await checkRateLimit(`${key}-other`, 3, 60_000);
    expect(other.success).toBe(true);
    expect(other.remaining).toBe(2);
  });
});

describe("audit log", () => {
  it("records entries with actor, target and metadata", async () => {
    const action = `it.action.${runId}`;
    await logAudit({
      actorId: "tester",
      action,
      targetType: "post",
      targetId: "post-1",
      metadata: { reason: "test" },
    });
    const entry = await prisma.auditLog.findFirst({ where: { action } });
    expect(entry?.actorId).toBe("tester");
    expect(entry?.targetId).toBe("post-1");
  });
});

describe("session tokens", () => {
  it("accepts a Bearer token and revokes it when tokenVersion changes", async () => {
    const user = await createUser();
    const token = await signSessionToken(user);
    const request = () =>
      new NextRequest("http://localhost/test", { headers: { authorization: `Bearer ${token}` } });

    expect((await getSession(request()))?.userId).toBe(user.id);

    await revokeAllSessions(user.id);
    expect(await getSession(request())).toBeNull();
  });

  it("still accepts legacy tokens with no version claim", async () => {
    const user = await createUser();
    const legacy = await new SignJWT({ userId: user.id, email: user.email, accountType: user.accountType })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(getAuthSecret());
    const request = new NextRequest("http://localhost/test", { headers: { authorization: `Bearer ${legacy}` } });
    expect((await getSession(request))?.userId).toBe(user.id);
  });
});

describe("withRoute", () => {
  const ok = () => NextResponse.json({ ok: true });
  const routes = {
    open: withRoute(() => Promise.resolve(ok()), { auth: "none" }),
    member: withRoute(() => Promise.resolve(ok())),
    admin: withRoute(() => Promise.resolve(ok()), { auth: "admin" }),
    validating: withRoute(async () => {
      z.object({ required: z.string() }).parse({});
      return ok();
    }),
    denied: withRoute(async () => {
      throw forbidden();
    }),
    broken: withRoute(async () => {
      throw new Error("boom");
    }),
    limited: withRoute(() => Promise.resolve(ok()), {
      auth: "none",
      rateLimit: { limit: 2, windowMs: 60_000, key: `it-rl-${runId}` },
    }),
  };

  it("enforces auth levels", async () => {
    await signInAs(null);
    expect((await call(routes.open)).status).toBe(200);
    expect((await call(routes.member)).status).toBe(401);
    expect((await call(routes.admin)).status).toBe(401);

    const member = await createUser();
    await signInAs(member);
    expect((await call(routes.member)).status).toBe(200);
    expect((await call(routes.admin)).status).toBe(403);

    const adminUser = await createUser({ isAdmin: true });
    await signInAs(adminUser);
    expect((await call(routes.admin)).status).toBe(200);
  });

  it("maps errors to the right status codes", async () => {
    const member = await createUser();
    await signInAs(member);
    expect((await call(routes.validating)).status).toBe(400);
    expect((await call(routes.denied)).status).toBe(403);
    expect((await call(routes.broken)).status).toBe(500);
  });

  it("rate limits per configured key and identity", async () => {
    expect((await call(routes.limited)).status).toBe(200);
    expect((await call(routes.limited)).status).toBe(200);
    const third = await call(routes.limited);
    expect(third.status).toBe(429);
    expect(third.json.message).toBe("Too many requests");
  });
});

afterAll(cleanupRun);
