import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { assertPostAccess } from "@/lib/post-access";
import { toMemberSafePost } from "@/lib/post-privacy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const { postId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Private-group posts are only commentable by group members.
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true, isHidden: true },
    });
    await assertPostAccess(post, userId);

    // Create the comment
    await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        postId: postId,
      },
    });

    // Fetch the updated post with all relations
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
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
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedPost && toMemberSafePost(updatedPost));
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
