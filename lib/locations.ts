import { prisma } from "@/lib/prisma";

// A "community" is an active TOWN location — the unit the platform is
// organised around (/burton-latimer/...).
export function getCommunityBySlug(slug: string) {
  return prisma.location.findFirst({
    where: { slug, type: "TOWN", isActive: true },
  });
}

// Until Organisation/Event models land, businesses are COMPANY accounts and
// groups carry the community data, so stats are platform-wide.
export function getCommunityStats() {
  return prisma.$transaction([
    prisma.user.count({ where: { accountType: "COMPANY" } }),
    prisma.group.count({ where: { status: "APPROVED" } }),
    prisma.user.count(),
  ]);
}
