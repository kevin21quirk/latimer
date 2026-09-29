import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
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
      dateOfBirth: true,
      phoneNumber: true,
      address: true,
      city: true,
      postcode: true,
      companyName: true,
      charityNumber: true,
      bio: true,
      profileImage: true,
      isAdmin: true,
      coverImage: true,
      interests: true,
      marketingConsent: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <ProfileClient user={user} />;
}
