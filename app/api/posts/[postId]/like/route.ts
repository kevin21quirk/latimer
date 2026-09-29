import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { assertPostAccess } from "@/lib/post-access";
import { feedPostInclude, toMemberSafePost } from "@/lib/post-privacy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireAuth();
    const { postId } = await params;

    // Private-group posts are only likeable by group members.
    const target = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true, isHidden: true },
    });
    await assertPostAccess(target, session.userId);

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.like.create({
        data: {
          userId: session.userId,
          postId: postId,
        },
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: feedPostInclude,
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(toMemberSafePost(post));
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Like post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
