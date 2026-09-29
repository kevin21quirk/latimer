import type { AccountType } from "@prisma/client";

export type Role = "ADMIN" | "RESIDENT" | "CHARITY" | "BUSINESS";

type UserLike = { isAdmin?: boolean | null; accountType: AccountType | string };

export function roleOf(user: UserLike): Role {
  if (user.isAdmin) return "ADMIN";
  if (user.accountType === "CHARITY") return "CHARITY";
  if (user.accountType === "COMPANY") return "BUSINESS";
  return "RESIDENT";
}

export type Permission =
  | "help-requests:view"
  | "help-requests:respond"
  | "help-requests:create"
  | "community:ask"
  | "marketplace:access"
  | "moderation:review"
  | "admin:access";

const PERMISSION_ROLES: Record<Permission, Role[]> = {
  // Vulnerable-person safeguarding: businesses never see help requests.
  "help-requests:view": ["ADMIN", "RESIDENT", "CHARITY"],
  "help-requests:respond": ["ADMIN", "RESIDENT", "CHARITY"],
  "help-requests:create": ["ADMIN", "RESIDENT", "CHARITY"],
  // Members-only features, per approved decision #4.
  "community:ask": ["ADMIN", "RESIDENT", "CHARITY", "BUSINESS"],
  "marketplace:access": ["ADMIN", "RESIDENT", "CHARITY", "BUSINESS"],
  "moderation:review": ["ADMIN"],
  "admin:access": ["ADMIN"],
};

export function hasPermission(user: UserLike | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return PERMISSION_ROLES[permission].includes(roleOf(user));
}

// Approved decision #3: businesses may reply to enquiries residents start but
// can never open a direct-message conversation with a resident.
export function canInitiateDirectMessage(sender: UserLike, recipient: UserLike): boolean {
  return !(roleOf(sender) === "BUSINESS" && roleOf(recipient) === "RESIDENT");
}
