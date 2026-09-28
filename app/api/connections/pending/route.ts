import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, getAuthSecret());
    const userId = payload.userId as string;

    // Get all pending connection requests where the user is the addressee
    const pendingRequests = await prisma.connection.findMany({
      where: {
        addresseeId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            accountType: true,
            profileImage: true,
            companyName: true,
            charityName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error("Error fetching pending connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending connections" },
      { status: 500 }
    );
  }
}
