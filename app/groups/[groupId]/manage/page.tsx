import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupManageClient from "@/components/groups/GroupManageClient";

export default async function GroupManagePage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      joinRequests: {
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) {
    redirect("/groups");
  }

  // Check if user is the creator/admin
  if (group.creatorId !== session.userId) {
    redirect("/groups");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      accountType: true,
      profileImage: true,
      isAdmin: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <GroupManageClient user={user} group={group} />;
}
