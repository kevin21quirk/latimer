import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsClient from "@/components/groups/GroupsClient";

export default async function GroupsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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

  const groups = await prisma.group.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userGroups = await prisma.groupMember.findMany({
    where: { userId: session.userId },
    include: {
      group: {
        include: {
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      },
    },
  });

  // Get groups created by the user (including pending ones)
  const createdGroups = await prisma.group.findMany({
    where: { creatorId: session.userId },
    include: {
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!user) {
    redirect("/login");
  }

  return <GroupsClient user={user} groups={groups} userGroups={userGroups} createdGroups={createdGroups} />;
}
