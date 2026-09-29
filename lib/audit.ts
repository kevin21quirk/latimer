import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditEntry = {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

// Audit logging must never break the request it records, so failures are
// logged and swallowed.
export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error("Audit log write failed:", entry.action, error);
  }
}
