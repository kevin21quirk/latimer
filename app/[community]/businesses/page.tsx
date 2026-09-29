import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";
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
    title: `Local businesses in ${community.name}`,
    description: `Browse local businesses and services in ${community.name}.`,
  };
}

export default async function BusinessesPage({
  params,
}: {
  params: Promise<{ community: string }>;
}) {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const businesses = await prisma.user.findMany({
    where: { accountType: "COMPANY", companyName: { not: null } },
    select: {
      id: true,
      companyName: true,
      businessType: true,
      description: true,
      website: true,
      city: true,
    },
    orderBy: { companyName: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Store className="h-6 w-6 text-accent" />
        Businesses in {community.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {businesses.length} {businesses.length === 1 ? "business" : "businesses"} listed
      </p>

      {businesses.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No businesses listed yet. Run a local business?{" "}
          <Link href="/register" className="text-accent underline">Create your free profile</Link>.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <div key={b.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="font-semibold">{b.companyName}</p>
              {b.businessType && (
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {b.businessType}
                </span>
              )}
              {b.description && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{b.description}</p>
              )}
              {b.website && (
                <a
                  href={b.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-accent hover:underline"
                >
                  Visit website
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
