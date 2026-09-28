import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, getAuthSecret());
    const userId = payload.userId as string;

    const { userId: blockedUserId } = await request.json();

    // Find existing connection
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: blockedUserId },
          { requesterId: blockedUserId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      // Update to blocked
      await prisma.connection.update({
        where: { id: existing.id },
        data: { status: "BLOCKED" },
      });
    } else {
      // Create new blocked connection
      await prisma.connection.create({
        data: {
          requesterId: userId,
          addresseeId: blockedUserId,
          status: "BLOCKED",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json(
      { error: "Failed to block user" },
      { status: 500 }
    );
  }
}
