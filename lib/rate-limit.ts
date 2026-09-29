import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

// Postgres-backed fixed-window limiter. The upsert keeps the increment atomic
// so concurrent requests cannot both pass the boundary.
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"
  `;
  const row = rows[0];
  return {
    success: row.count <= limit,
    limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt,
  };
}

export async function clearExpiredRateLimits() {
  return prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
