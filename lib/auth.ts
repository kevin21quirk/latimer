import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAuthSecret } from "@/lib/auth-secret";
import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized } from "@/lib/errors";

export const SESSION_COOKIE = "auth-token";
const SESSION_TTL = "7d";

export type SessionPayload = {
  userId: string;
  email: string;
  accountType: string;
  // User.tokenVersion at sign time; tokens signed before versioning existed
  // have no claim and skip the revocation check.
  tv?: number;
};

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Confirms the token's version still matches the database so revoked sessions
// stop working immediately. Tokens with no version claim stay valid.
async function resolveSession(payload: SessionPayload | null): Promise<SessionPayload | null> {
  if (!payload?.userId) return null;
  if (payload.tv === undefined) return payload;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  });
  return user && user.tokenVersion === payload.tv ? payload : null;
}

// Cookie auth for the web app; pass a NextRequest to also accept
// "Authorization: Bearer <token>" for API clients (mobile later).
export async function getSession(request?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;
  const bearer = request?.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    token = bearer.slice("Bearer ".length).trim();
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE)?.value;
  }
  if (!token) return null;
  return resolveSession(await verifyToken(token));
}

export async function requireAuth(request?: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    throw unauthorized();
  }
  return session;
}

export async function requireAdmin(request?: NextRequest) {
  const session = await requireAuth(request);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    throw forbidden();
  }
  return session;
}

export function signSessionToken(user: {
  id: string;
  email: string;
  accountType: string;
  tokenVersion: number;
}) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    accountType: user.accountType,
    tv: user.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getAuthSecret());
}

// Invalidates every existing session for the user (password change, ban,
// account compromise).
export async function revokeAllSessions(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
