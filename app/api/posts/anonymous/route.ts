import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateUserRiskScore, moderateText } from "@/lib/moderation";
import { z } from "zod";

const createAnonymousPostSchema = z.object({
  content: z.string().min(1),
  anonymousContactEmail: z.string().email().nullable().optional(),
});

// Create anonymous post
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = createAnonymousPostSchema.parse(await request.json());

    const author = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { createdAt: true, isAdmin: true, accountType: true },
    });
    if (!author) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const textModeration = moderateText(data.content);
    if (textModeration.isBlocked) {
      return NextResponse.json(
        { error: "Content contains prohibited material" },
        { status: 403 }
      );
    }
    const riskScore = textModeration.riskScore + calculateUserRiskScore(author);
    const isFlagged = riskScore >= 40;

    const post = await prisma.post.create({
      data: {
        content: data.content.trim(),
        userId: session.userId,
        isAnonymous: true,
        anonymousContactEmail: data.anonymousContactEmail || null,
        postType: "GENERAL",
        riskScore,
        isFlagged,
        flaggedAt: isFlagged ? new Date() : null,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", errors: error.issues }, { status: 400 });
    }
    console.error("Error creating anonymous post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// Get user's own anonymous posts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        userId: session.userId,
        isAnonymous: true,
      },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                accountType: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching anonymous posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
