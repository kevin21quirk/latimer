import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WellbeingClient from "@/components/wellbeing/WellbeingClient";

export default async function WellbeingPage() {
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

  // Get published wellbeing resources
  const resources = await prisma.wellbeingResource.findMany({
    where: { isPublished: true },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          accountType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <WellbeingClient user={user} resources={resources} />;
}
