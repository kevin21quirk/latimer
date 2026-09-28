import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DiscoverClient from "@/components/discover/DiscoverClient";

export default async function DiscoverPage() {
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
      interests: true,
      companyName: true,
      charityName: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get all users with interests
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
      companyName: true,
      charityName: true,
    },
    orderBy: {
      firstName: "asc",
    },
  });

  // Get all approved groups with interests
  const allGroups = await prisma.group.findMany({
    where: {
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      interests: true,
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return <DiscoverClient user={user} allUsers={allUsers} allGroups={allGroups} />;
}
