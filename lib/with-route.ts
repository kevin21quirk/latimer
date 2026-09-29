import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin, requireAuth, type SessionPayload } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export type RouteContext<P> = {
  request: NextRequest;
  session: SessionPayload | null;
  params: P;
};

type Handler<P> = (ctx: RouteContext<P>) => Promise<Response>;

type Options = {
  // "none": no session lookup. "optional": session if present. "user":
  // authenticated member. "admin": platform admin.
  auth?: "none" | "optional" | "user" | "admin";
  rateLimit?: { limit: number; windowMs: number; key?: string };
};

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

// Shared wrapper for API handlers: uniform auth, rate limiting and error
// mapping (HttpError -> status, ZodError -> 400, anything else -> 500).
export function withRoute<P = Record<string, never>>(handler: Handler<P>, options: Options = {}) {
  return async (request: NextRequest, routeContext: { params: Promise<P> }) => {
    try {
      const auth = options.auth ?? "user";
      let session: SessionPayload | null = null;
      if (auth === "admin") {
        session = await requireAdmin(request);
      } else if (auth === "user") {
        session = await requireAuth(request);
      } else if (auth === "optional") {
        session = await getSession(request);
      }

      if (options.rateLimit) {
        const { limit, windowMs } = options.rateLimit;
        const identity = session?.userId ?? clientIp(request);
        const result = await checkRateLimit(`${options.rateLimit.key ?? request.nextUrl.pathname}:${identity}`, limit, windowMs);
        if (!result.success) {
          return NextResponse.json(
            { message: "Too many requests" },
            {
              status: 429,
              headers: { "Retry-After": Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)).toString() },
            }
          );
        }
      }

      return await handler({ request, session, params: await routeContext.params });
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json({ message: "Invalid data", errors: error.issues }, { status: 400 });
      }
      console.error("Unhandled route error:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
  };
}
