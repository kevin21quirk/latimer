import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { feedPostInclude, toMemberSafePost } from "@/lib/post-privacy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await requireAuth();
    const { postId } = await params;

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
    console.error("Like post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
