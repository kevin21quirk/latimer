import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { feedPostInclude, toMemberSafePost } from "@/lib/post-privacy";

export default async function DashboardPage() {
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
      bio: true,
    },
  });

  // Get user's group memberships
  const userGroupIds = await prisma.groupMember.findMany({
    where: { userId: session.userId },
    select: { groupId: true },
  });

  const memberGroupIds = userGroupIds.map(g => g.groupId);

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        {
          OR: [
            { groupId: null }, // Public posts
            { groupId: { in: memberGroupIds } }, // Posts in groups user is a member of
          ],
        },
        { isHidden: false }, // Filter out hidden posts
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: feedPostInclude,
  });

  // Get groups created by user with pending join requests
  const userGroups = await prisma.group.findMany({
    where: {
      creatorId: session.userId,
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          joinRequests: {
            where: {
              status: "PENDING",
            },
          },
        },
      },
    },
  });

  // Get pending connection requests for the user
  const pendingConnectionRequests = await prisma.connection.findMany({
    where: {
      addresseeId: session.userId,
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          accountType: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient 
    user={user} 
    initialPosts={posts.map(toMemberSafePost)} 
    userGroups={userGroups}
    pendingConnectionRequests={pendingConnectionRequests}
  />;
}
