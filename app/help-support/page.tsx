import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HelpSupportClient from "@/components/help-support/HelpSupportClient";

export default async function HelpSupportPage() {
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

  if (!user) {
    redirect("/login");
  }

  // Get user's help requests
  const myRequests = await prisma.helpRequest.findMany({
    where: { requesterId: session.userId },
    include: {
      helper: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get help requests user is helping with
  const helpingWith = await prisma.helpRequest.findMany({
    where: { helperId: session.userId },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get nearby open help requests (exclude user's own)
  const nearbyRequests = await prisma.helpRequest.findMany({
    where: {
      status: "OPEN",
      requesterId: { not: session.userId },
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          city: true,
        },
      },
    },
    orderBy: [
      { urgency: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
  });

  return (
    <HelpSupportClient
      user={user}
      myRequests={myRequests}
      helpingWith={helpingWith}
      nearbyRequests={nearbyRequests}
    />
  );
}
