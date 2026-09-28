import type { Prisma } from "@prisma/client";

export const ANONYMOUS_AUTHOR_ID = "anonymous";

const ANONYMOUS_AUTHOR = {
  id: ANONYMOUS_AUTHOR_ID,
  firstName: "Anonymous",
  lastName: "Member",
  accountType: "INDIVIDUAL",
  profileImage: null,
  companyName: null,
};

const HIDDEN_POST_FIELDS = ["anonymousContactEmail", "moderationNotes", "riskScore", "reviewedBy"] as const;

type HiddenPostField = (typeof HIDDEN_POST_FIELDS)[number];

type PostForMembers = {
  isAnonymous: boolean;
  userId: string;
  user: { id: string };
  comments?: { id: string; userId?: string; user?: { id: string } }[];
};

export const feedPostInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      accountType: true,
      profileImage: true,
      companyName: true,
    },
  },
  likes: { select: { userId: true } },
  comments: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.PostInclude;

// Strips author identity from anonymous (Safe Space) posts, including the author's own
// replies, and removes moderation-only fields before a post is sent to non-admin users.
export function toMemberSafePost<T extends PostForMembers>(post: T): Omit<T, HiddenPostField> {
  const safe: Record<string, unknown> = { ...post };
  for (const field of HIDDEN_POST_FIELDS) delete safe[field];

  if (!post.isAnonymous) return safe as Omit<T, HiddenPostField>;

  safe.userId = ANONYMOUS_AUTHOR_ID;
  safe.user = { ...ANONYMOUS_AUTHOR };
  if (post.comments) {
    safe.comments = post.comments.map((comment) =>
      (comment.userId ?? comment.user?.id) === post.userId
        ? { ...comment, userId: ANONYMOUS_AUTHOR_ID, user: { ...ANONYMOUS_AUTHOR } }
        : comment
    );
  }
  return safe as Omit<T, HiddenPostField>;
}
