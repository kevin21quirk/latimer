import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { feedPostInclude, toMemberSafePost } from "@/lib/post-privacy";
import { calculateUserRiskScore, moderateText } from "@/lib/moderation";
import { forbidden, HttpError } from "@/lib/errors";
import { z } from "zod";

const createPostSchema = z.object({
  content: z.string().min(1),
  postType: z.enum(["GENERAL", "HELP_REQUEST", "BUSINESS_AD", "EVENT"]).default("GENERAL"),
  images: z.array(z.string()).optional(),
  video: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createPostSchema.parse(body);

    const author = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { createdAt: true, isAdmin: true, accountType: true },
    });
    if (!author) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (data.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: session.userId, groupId: data.groupId } },
        select: { id: true },
      });
      if (!membership) {
        throw forbidden("You are not a member of this group");
      }
    }

    // Moderation is always computed server-side; clients cannot supply or
    // bypass risk scores.
    const textModeration = moderateText(data.content);
    if (textModeration.isBlocked) {
      return NextResponse.json(
        { error: "Content contains prohibited material", message: "Content contains prohibited material", flags: textModeration.flags },
        { status: 403 }
      );
    }
    const riskScore = textModeration.riskScore + calculateUserRiskScore(author);
    const isFlagged = riskScore >= 40;

    const post = await prisma.post.create({
      data: {
        content: data.content,
        postType: data.postType,
        images: data.images || [],
        video: data.video || null,
        userId: session.userId,
        groupId: data.groupId || null,
        riskScore,
        isFlagged,
        flaggedAt: isFlagged ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            accountType: true,
            profileImage: true,
            companyName: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(toMemberSafePost(post), { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Create post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      select: { groupId: true },
    });

    const posts = await prisma.post.findMany({
      where: {
        isHidden: false,
        OR: [
          { groupId: null },
          { groupId: { in: memberships.map((m) => m.groupId) } },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: feedPostInclude,
    });

    return NextResponse.json(posts.map(toMemberSafePost));
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
