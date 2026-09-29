import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canInitiateDirectMessage } from "@/lib/permissions";
import { z } from "zod";

const createMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { accountType: true, isAdmin: true },
      }),
      prisma.user.findUnique({
        where: { id: data.receiverId },
        select: { id: true, accountType: true, isAdmin: true },
      }),
    ]);

    if (!receiver) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Businesses can reply to resident enquiries but never open a
    // conversation with a resident (approved decision #3).
    if (sender && !canInitiateDirectMessage(sender, receiver)) {
      const residentStarted = await prisma.message.findFirst({
        where: { senderId: receiver.id, receiverId: session.userId },
        select: { id: true },
      });
      if (!residentStarted) {
        return NextResponse.json(
          { message: "Businesses can only reply to messages started by residents" },
          { status: 403 }
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        content: data.content,
        senderId: session.userId,
        receiverId: data.receiverId,
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
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Create message error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");

    if (otherUserId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: session.userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
      });

      return NextResponse.json(messages);
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.userId },
          { receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
