import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/errors";

// Hidden and private-group posts must not be readable or writable by
// unauthorised members; group membership is checked server-side.
export async function assertPostAccess(
  post: { groupId: string | null; isHidden: boolean } | null,
  userId: string
) {
  if (!post || post.isHidden) {
    throw notFound("Post not found");
  }
  if (post.groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: post.groupId } },
      select: { id: true },
    });
    if (!member) {
      throw forbidden();
    }
  }
}
