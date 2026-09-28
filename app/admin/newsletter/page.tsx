import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import NewsletterClient from "@/components/admin/NewsletterClient";
import { getAuthSecret } from "@/lib/auth-secret";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return null;
  }

  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token.value, secret);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });

    if (!user || !user.isAdmin) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export default async function NewsletterPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  // Get count of users who opted in for newsletters
  const subscriberCount = await prisma.user.count({
    where: { marketingConsent: true },
  });

  return <NewsletterClient user={user} subscriberCount={subscriberCount} />;
}
