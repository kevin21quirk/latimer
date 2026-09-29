import { describe, expect, it } from "vitest";
import { ANONYMOUS_AUTHOR_ID, toMemberSafePost } from "./post-privacy";

const author = {
  id: "u_author",
  firstName: "Jane",
  lastName: "Doe",
  accountType: "INDIVIDUAL",
  profileImage: "data:image/png;base64,AAAA",
  companyName: null,
};
const other = { id: "u_other", firstName: "Bob", lastName: "Smith" };

describe("toMemberSafePost", () => {
  const anonymous = toMemberSafePost({
    id: "p1",
    content: "I need help",
    isAnonymous: true,
    userId: author.id,
    user: author,
    anonymousContactEmail: "jane@example.com",
    moderationNotes: "internal note",
    riskScore: 40,
    reviewedBy: "admin_1",
    likes: [{ userId: other.id }],
    comments: [
      { id: "c1", userId: author.id, user: { id: author.id, firstName: "Jane", lastName: "Doe" } },
      { id: "c2", user: { id: author.id, firstName: "Jane", lastName: "Doe" } },
      { id: "c3", userId: other.id, user: other },
    ],
  });

  it("never exposes the author of an anonymous post", () => {
    const json = JSON.stringify(anonymous);
    for (const leak of ["Jane", "Doe", "u_author", "jane@example.com", "data:image"]) {
      expect(json).not.toContain(leak);
    }
    expect(anonymous.userId).toBe(ANONYMOUS_AUTHOR_ID);
    expect(anonymous.user.id).toBe(ANONYMOUS_AUTHOR_ID);
  });

  it("anonymises the author's own replies but keeps other commenters", () => {
    expect(anonymous.comments[0].user?.id).toBe(ANONYMOUS_AUTHOR_ID);
    expect(anonymous.comments[1].user?.id).toBe(ANONYMOUS_AUTHOR_ID);
    expect(anonymous.comments[2].user?.id).toBe(other.id);
    expect(anonymous.likes[0].userId).toBe(other.id);
  });

  it("strips moderation-only fields from every post", () => {
    const normal = toMemberSafePost({
      id: "p2",
      isAnonymous: false,
      userId: author.id,
      user: author,
      riskScore: 5,
      moderationNotes: "note",
      reviewedBy: "admin",
      anonymousContactEmail: null,
    });
    expect(normal.user.firstName).toBe("Jane");
    expect(normal.userId).toBe(author.id);
    for (const field of ["riskScore", "moderationNotes", "reviewedBy", "anonymousContactEmail"]) {
      expect(normal).not.toHaveProperty(field);
    }
  });
});
