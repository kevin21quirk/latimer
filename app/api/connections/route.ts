import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth-secret";

const connectionSchema = z.object({
  addresseeId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, getAuthSecret());
    const userId = payload.userId as string;

    const body = await request.json();
    const { addresseeId } = connectionSchema.parse(body);

    // Check if connection already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: userId,
        addresseeId,
        status: "PENDING",
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
