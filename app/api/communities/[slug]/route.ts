import { NextResponse } from "next/server";
import { withRoute } from "@/lib/with-route";
import { getCommunityBySlug, getCommunityStats } from "@/lib/locations";
import { notFound } from "@/lib/errors";

// GET /api/communities/[slug] — public community info + headline stats.
export const GET = withRoute<{ slug: string }>(
  async ({ params }) => {
    const community = await getCommunityBySlug(params.slug);
    if (!community) {
      throw notFound("Community not found");
    }

    const [businesses, groups, members] = await getCommunityStats();

    return NextResponse.json({
      slug: community.slug,
      name: community.name,
      postcode: community.postcode,
      stats: { businesses, groups, members },
    });
  },
  { auth: "none", rateLimit: { limit: 60, windowMs: 60_000 } }
);
