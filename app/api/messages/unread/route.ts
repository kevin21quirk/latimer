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
      return NextResponse.json({ count: 0, messages: [] }, { status: 200 });
    }

    try {
      const { payload } = await jwtVerify(token.value, getAuthSecret());
      const userId = payload.userId as string;
      
      console.log('API - Checking messages for userId:', userId);

      // Get unread messages count
      const unreadCount = await prisma.message.count({
        where: {
          receiverId: userId,
          read: false,
        },
      });
      
      console.log('API - Found unread count:', unreadCount);

      // Get recent unread messages (last 5)
      const messages = await prisma.message.findMany({
        where: {
          receiverId: userId,
          read: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      return NextResponse.json({
        count: unreadCount,
        messages: messages || [],
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json({ count: 0, messages: [] }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return NextResponse.json({ count: 0, messages: [] }, { status: 200 });
  }
}
