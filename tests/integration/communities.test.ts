import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getCommunity } from "@/app/api/communities/[slug]/route";
import { call } from "./helpers";

describe("community API", () => {
  afterAll(async () => {
    await prisma.location.deleteMany({ where: { slug: "it-test-town" } });
  });

  it("returns public community info and stats without auth", async () => {
    const { status, json } = await call(getCommunity, { params: { slug: "burton-latimer" } });
    expect(status).toBe(200);
    expect(json.slug).toBe("burton-latimer");
    expect(json.name).toBe("Burton Latimer");
    expect(json.stats).toMatchObject({
      businesses: expect.any(Number),
      groups: expect.any(Number),
      members: expect.any(Number),
    });
  });

  it("404s for unknown or inactive slugs", async () => {
    await prisma.location.create({
      data: { slug: "it-test-town", name: "Inactive Town", type: "TOWN", isActive: false },
    });
    expect((await call(getCommunity, { params: { slug: "nowhere-ville" } })).status).toBe(404);
    expect((await call(getCommunity, { params: { slug: "it-test-town" } })).status).toBe(404);
  });
});
