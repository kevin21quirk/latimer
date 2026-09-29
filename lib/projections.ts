import type { Prisma } from "@prisma/client";

// Members-only projection: full name and avatar, never contact details.
export const MEMBER_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  accountType: true,
  profileImage: true,
} satisfies Prisma.UserSelect;

// Public projection for logged-out pages (decision #4): residents appear as
// "Sarah P." — never full surname, email, or contact details.
export const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

export function publicDisplayName(user: { firstName: string; lastName: string }): string {
  const initial = user.lastName.trim().charAt(0);
  return initial ? `${user.firstName} ${initial}.` : user.firstName;
}

export function toPublicUser(user: { id: string; firstName: string; lastName: string }) {
  return { id: user.id, displayName: publicDisplayName(user) };
}
