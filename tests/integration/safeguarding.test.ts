import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as listHelpRequests, POST as createHelpRequest } from "@/app/api/help-requests/route";
import { POST as offerHelp } from "@/app/api/help-requests/[requestId]/offer/route";
import { POST as sendMessage } from "@/app/api/messages/route";
import { POST as createPost } from "@/app/api/posts/route";
import { POST as commentOnPost } from "@/app/api/posts/[postId]/comments/route";
import { POST as likePost } from "@/app/api/posts/[postId]/like/route";
import { POST as createAnonymousPost } from "@/app/api/posts/anonymous/route";
import { call, cleanupRun, createUser, signInAs } from "./helpers";

describe("help request safeguarding", () => {
  let requester: Awaited<ReturnType<typeof createUser>>;
  let helper: Awaited<ReturnType<typeof createUser>>;
  let business: Awaited<ReturnType<typeof createUser>>;
  let requestId: string;

  beforeAll(async () => {
    requester = await createUser();
    helper = await createUser();
    business = await createUser({ accountType: "COMPANY", companyName: "Test Co" });
    await signInAs(requester);
    const { json } = await call(createHelpRequest, {
      method: "POST",
      body: { title: "Need a lift", description: "To the GP", type: "TRANSPORT", urgency: "LOW", location: "42 Secret Lane" },
    });
    requestId = json.id;
  });

  afterAll(cleanupRun);

  it("hides help requests from business accounts", async () => {
    await signInAs(business);
    expect((await call(listHelpRequests)).status).toBe(403);
    expect((await call(createHelpRequest, { method: "POST", body: { title: "t", description: "d", type: "OTHER", urgency: "LOW" } })).status).toBe(403);
    expect((await call(offerHelp, { method: "POST", params: { requestId } })).status).toBe(403);
  });

  it("shows first names only and hides exact location from other members", async () => {
    await signInAs(helper);
    const { status, json, text } = await call(listHelpRequests);
    expect(status).toBe(200);
    const mine = json.find((r: { id: string }) => r.id === requestId);
    expect(mine.requester.firstName).toBe(requester.firstName);
    expect(mine.requester.lastName).toBeUndefined();
    expect(mine.location).toBeNull();
    expect(text).not.toContain("42 Secret Lane");
    expect(text).not.toContain(requester.lastName);
  });

  it("lets the requester see their own location", async () => {
    await signInAs(requester);
    const { json } = await call(listHelpRequests);
    const mine = json.find((r: { id: string }) => r.id === requestId);
    expect(mine.location).toBe("42 Secret Lane");
  });

  it("lets residents offer help", async () => {
    await signInAs(helper);
    const { status, json } = await call(offerHelp, { method: "POST", params: { requestId } });
    expect(status).toBe(200);
    expect(json.helperId).toBe(helper.id);
    expect(json.status).toBe("IN_PROGRESS");
  });
});

describe("business direct messaging", () => {
  let resident: Awaited<ReturnType<typeof createUser>>;
  let otherResident: Awaited<ReturnType<typeof createUser>>;
  let business: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    resident = await createUser();
    otherResident = await createUser();
    business = await createUser({ accountType: "COMPANY", companyName: "DM Test Co" });
  });

  afterAll(cleanupRun);

  it("blocks a business from starting a conversation with a resident", async () => {
    await signInAs(business);
    const { status } = await call(sendMessage, { method: "POST", body: { receiverId: resident.id, content: "Special offer!" } });
    expect(status).toBe(403);
  });

  it("lets the business reply once the resident messages first", async () => {
    await signInAs(resident);
    expect((await call(sendMessage, { method: "POST", body: { receiverId: business.id, content: "Do you deliver?" } })).status).toBe(201);
    await signInAs(business);
    expect((await call(sendMessage, { method: "POST", body: { receiverId: resident.id, content: "Yes, on Fridays" } })).status).toBe(201);
  });

  it("still allows resident-to-resident messages", async () => {
    await signInAs(resident);
    expect((await call(sendMessage, { method: "POST", body: { receiverId: otherResident.id, content: "Hi neighbour" } })).status).toBe(201);
  });
});

describe("server-side moderation and group access", () => {
  let author: Awaited<ReturnType<typeof createUser>>;
  let outsider: Awaited<ReturnType<typeof createUser>>;
  let privatePostId: string;
  let groupId: string;

  beforeAll(async () => {
    author = await createUser();
    outsider = await createUser();
    const group = await prisma.group.create({
      data: {
        name: "Members Only",
        isPrivate: true,
        status: "APPROVED",
        creatorId: author.id,
        members: { create: { userId: author.id, role: "ADMIN" } },
      },
    });
    groupId = group.id;
  });

  afterAll(cleanupRun);

  it("computes risk scores itself and ignores client-supplied values", async () => {
    await signInAs(author);
    const { status, json } = await call(createPost, {
      method: "POST",
      body: { content: "Lovely day at the park", riskScore: 999, isFlagged: true },
    });
    expect(status).toBe(201);
    const stored = await prisma.post.findUnique({ where: { id: json.id } });
    expect(stored?.isFlagged).toBe(false);
  });

  it("blocks prohibited content even when the client skips moderation", async () => {
    await signInAs(author);
    const { status } = await call(createPost, {
      method: "POST",
      body: { content: "Please send money to my account number 12345678" },
    });
    expect(status).toBe(403);
  });

  it("flags risky content for review", async () => {
    await signInAs(author);
    const { status, json } = await call(createPost, {
      method: "POST",
      body: { content: "Urgent: meet me alone and bring your credit card" },
    });
    expect(status).toBe(201);
    const stored = await prisma.post.findUnique({ where: { id: json.id } });
    expect(stored?.isFlagged).toBe(true);
  });

  it("moderates anonymous posts too", async () => {
    await signInAs(author);
    const { status } = await call(createAnonymousPost, {
      method: "POST",
      body: { content: "send money now, bank details enclosed" },
    });
    expect(status).toBe(403);
  });

  it("rejects posting into a group the user has not joined", async () => {
    await signInAs(outsider);
    expect(
      (await call(createPost, { method: "POST", body: { content: "Hello?", groupId } })).status
    ).toBe(403);

    await signInAs(author);
    const { status, json } = await call(createPost, { method: "POST", body: { content: "Hello members", groupId } });
    expect(status).toBe(201);
    privatePostId = json.id;
  });

  it("stops non-members commenting on or liking private-group posts", async () => {
    await signInAs(outsider);
    expect((await call(commentOnPost, { method: "POST", params: { postId: privatePostId }, body: { content: "hi" } })).status).toBe(403);
    expect((await call(likePost, { method: "POST", params: { postId: privatePostId } })).status).toBe(403);

    await signInAs(author);
    expect((await call(commentOnPost, { method: "POST", params: { postId: privatePostId }, body: { content: "welcome" } })).status).toBe(200);
  });
});
