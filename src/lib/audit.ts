import "server-only";
import { prisma } from "@/lib/db";

export async function audit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        meta: (params.meta ?? {}) as object,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("audit log failed", error);
  }
}
