import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContactsClient from "@/components/contacts/ContactsClient";

export default async function ContactsPage() {
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
      interests: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get all connections for this user
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: user.id },
        { addresseeId: user.id },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          accountType: true,
          profileImage: true,
          interests: true,
        },
      },
      addressee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          accountType: true,
          profileImage: true,
          interests: true,
        },
      },
    },
  });

  // Get all users for search (excluding current user)
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: user.id },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      accountType: true,
      profileImage: true,
      interests: true,
    },
    orderBy: {
      firstName: "asc",
    },
  });

  // Get user's group memberships and join requests
  const userGroupMemberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const memberGroupIds = userGroupMemberships.map((m) => m.groupId);

  const userJoinRequests = await prisma.groupJoinRequest.findMany({
    where: { userId: user.id },
    select: { groupId: true, status: true },
  });
  const requestedGroupIds = userJoinRequests.map((r) => r.groupId);

  // Get all approved groups with interests
  const allGroups = await prisma.group.findMany({
    where: {
      status: "APPROVED",
      id: { notIn: memberGroupIds }, // Exclude groups user is already in
    },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      interests: true,
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });

  // Calculate user recommendations based on shared interests
  const userRecommendations = allUsers
    .map((u) => {
      const sharedInterests = u.interests.filter((interest: string) =>
        user.interests?.includes(interest)
      );
      return {
        ...u,
        sharedInterests,
        matchScore: sharedInterests.length,
      };
    })
    .filter((u) => u.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  // Calculate group recommendations based on shared interests
  const groupRecommendations = allGroups
    .map((g) => {
      const sharedInterests = g.interests.filter((interest: string) =>
        user.interests?.includes(interest)
      );
      const isPending = userJoinRequests.find(
        (r) => r.groupId === g.id && r.status === "PENDING"
      );
      return {
        ...g,
        sharedInterests,
        matchScore: sharedInterests.length,
        isPending: !!isPending,
      };
    })
    .filter((g) => g.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return <ContactsClient 
    user={user} 
    connections={connections} 
    allUsers={allUsers} 
    userRecommendations={userRecommendations}
    groupRecommendations={groupRecommendations}
  />;
}
