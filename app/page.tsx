import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// The community landing page is the front door. Redirect / to the first
// active town (Burton Latimer); as more towns are added this can become a
// town chooser or geo-aware redirect.
export default async function Home() {
  const town = await prisma.location.findFirst({
    where: { type: "TOWN", isActive: true },
    orderBy: { slug: "asc" },
  });

  redirect(town ? `/${town.slug}` : "/login");
}
