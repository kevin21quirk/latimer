import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as listPosts } from "@/app/api/posts/route";
import { POST as likePost } from "@/app/api/posts/[postId]/like/route";
import { POST as commentOnPost } from "@/app/api/posts/[postId]/comments/route";
import { GET as searchUsers } from "@/app/api/users/search/route";
import { call, cleanupRun, createUser, signInAs } from "./helpers";

describe("post and member privacy", () => {
  let author: Awaited<ReturnType<typeof createUser>>;
  let viewer: Awaited<ReturnType<typeof createUser>>;
  let anonPostId: string;

  beforeAll(async () => {
    author = await createUser({ firstName: "Secretive" });
    viewer = await createUser({ firstName: "Nosy" });
    const group = await prisma.group.create({
      data: {
        name: "Private",
        isPrivate: true,
        status: "APPROVED",
        creatorId: author.id,
        members: { create: { userId: author.id, role: "ADMIN" } },
      },
    });
    await prisma.post.create({ data: { content: "PRIVATE_GROUP_POST", userId: author.id, groupId: group.id } });
    const anon = await prisma.post.create({
      data: { content: "ANON_POST", userId: author.id, isAnonymous: true, anonymousContactEmail: "contact@test.invalid" },
    });
    anonPostId = anon.id;
    await prisma.comment.create({ data: { content: "AUTHOR_REPLY", userId: author.id, postId: anon.id } });
  });

  afterAll(cleanupRun);

  it("rejects the feed API without a session", async () => {
    await signInAs(null);
    expect((await call(listPosts)).status).toBe(401);
  });

  it("hides anonymous authors and private group posts from other members", async () => {
    await signInAs(viewer);
    const { status, text } = await call(listPosts, { query: "?limit=50" });
    expect(status).toBe(200);
    expect(text).toContain("ANON_POST");
    expect(text).not.toContain("PRIVATE_GROUP_POST");
    for (const leak of ["Secretive", author.email, author.id, "contact@test.invalid", "riskScore"]) {
      expect(text).not.toContain(leak);
    }
  });

  it("shows private group posts to members", async () => {
    await signInAs(author);
    expect((await call(listPosts, { query: "?limit=50" })).text).toContain("PRIVATE_GROUP_POST");
  });

  it("likes return the anonymised post", async () => {
    await signInAs(viewer);
    const { status, json } = await call(likePost, { method: "POST", params: { postId: anonPostId } });
    expect(status).toBe(200);
    expect(json.likes).toHaveLength(1);
    expect(json.user.firstName).toBe("Anonymous");
  });

  it("comments work and keep the author anonymous", async () => {
    await signInAs(viewer);
    const { status, text } = await call(commentOnPost, {
      method: "POST",
      params: { postId: anonPostId },
      body: { content: "VIEWER_REPLY" },
    });
    expect(status).toBe(200);
    expect(text).toContain("VIEWER_REPLY");
    expect(text).toContain("AUTHOR_REPLY");
    expect(text).not.toContain("Secretive");
    expect(text).toContain("Nosy");
  });

  it("user search never returns or matches email addresses", async () => {
    await signInAs(viewer);
    const byName = await call(searchUsers, { query: "?q=Secretive" });
    expect(byName.json.length).toBeGreaterThan(0);
    expect(byName.text).not.toContain("@test.invalid");
    const byEmail = await call(searchUsers, { query: `?q=${encodeURIComponent(author.email.slice(0, 12))}` });
    expect(byEmail.json).toEqual([]);
  });
});
