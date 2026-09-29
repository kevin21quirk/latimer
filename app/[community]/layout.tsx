import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCommunityBySlug } from "@/lib/locations";
import BottomNav from "@/components/shared/BottomNav";

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ community: string }>;
}) {
  const { community: slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) {
    notFound();
  }

  const session = await getSession();

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {children}
      <BottomNav community={community.slug} signedIn={!!session} />
    </div>
  );
}
