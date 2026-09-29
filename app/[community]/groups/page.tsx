import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCommunityBySlug } from "@/lib/locations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ community: string }>;
}): Promise<Metadata> {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return {};
  return {
    title: `Community groups in ${community.name}`,
    description: `Clubs, societies and community groups in ${community.name}.`,
  };
}

export default async function CommunityGroupsPage({
  params,
}: {
  params: Promise<{ community: string }>;
}) {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const groups = await prisma.group.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      name: true,
      description: true,
      interests: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Users className="h-6 w-6 text-accent" />
        Groups in {community.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {groups.length} {groups.length === 1 ? "group" : "groups"}
      </p>

      {groups.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No community groups yet.{" "}
          <Link href="/register" className="text-accent underline">Join to start one</Link>.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="font-semibold">{g.name}</p>
              {g.description && (
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {g._count.members} {g._count.members === 1 ? "member" : "members"}
                </p>
                <Link href="/register" className="text-sm font-medium text-accent hover:underline">
                  Join to participate
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
