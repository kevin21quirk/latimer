import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Calendar, HandHeart, Store, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCommunityBySlug } from "@/lib/locations";
import { getSession } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ community: string }>;
}): Promise<Metadata> {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return {};
  return {
    title: `${community.name} Community — local businesses, events and ways to connect`,
    description: `Discover local businesses, services, events and groups in ${community.name}. The digital place to connect with your community.`,
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ community: string }>;
}) {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const session = await getSession();

  const [businesses, groups, openHelpRequests] = await Promise.all([
    prisma.user.findMany({
      where: { accountType: "COMPANY", companyName: { not: null } },
      select: { id: true, companyName: true, businessType: true, description: true },
      take: 6,
      orderBy: { createdAt: "asc" },
    }),
    prisma.group.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, description: true, _count: { select: { members: true } } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.helpRequest.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-10 text-center sm:py-16">
          <Image
            src="/logos/BL-Connect-Trans.png"
            alt="Burton Latimer Connect"
            width={200}
            height={200}
            className="h-24 w-auto"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {community.name}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The digital place to discover local businesses, services, events and
            ways to connect with your community.
          </p>
          <div className="mt-6 flex gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Go to your feed
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Join {community.name}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {/* Local businesses */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Store className="h-5 w-5 text-accent" />
              Local businesses
            </h2>
            <Link href={`/${community.slug}/businesses`} className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {businesses.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No businesses listed yet. Run a local business?{" "}
              <Link href="/register" className="text-accent underline">Join and create your profile</Link>.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((b) => (
                <div key={b.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="font-semibold">{b.companyName}</p>
                  {b.businessType && <p className="text-xs text-muted-foreground">{b.businessType}</p>}
                  {b.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Community groups */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Users className="h-5 w-5 text-accent" />
              Community groups
            </h2>
            <Link href={`/${community.slug}/groups`} className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No community groups yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="font-semibold">{g.name}</p>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {g._count.members} {g._count.members === 1 ? "member" : "members"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Get involved */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <HandHeart className="h-5 w-5 text-accent" />
            Get involved
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {openHelpRequests > 0
              ? `${openHelpRequests} neighbour${openHelpRequests === 1 ? "" : "s"} in ${community.name} could use a hand right now.`
              : `Volunteer, join a group, or offer support to neighbours in ${community.name}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={session ? "/help-support" : "/register"} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
              Help a neighbour
            </Link>
            <Link href={session ? "/groups" : "/register"} className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold hover:bg-gray-50">
              <Users className="mr-1 inline h-4 w-4" /> Join a group
            </Link>
          </div>
        </section>

        {/* Coming soon strip */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Calendar, label: "Local events — coming soon" },
            { icon: Building2, label: "Jobs & volunteering — coming soon" },
            { icon: Store, label: "Offers & marketplace — coming soon" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Icon className="h-4 w-4" /> {label}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
