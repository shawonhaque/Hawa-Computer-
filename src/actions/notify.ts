import "server-only";
import { prisma } from "@/lib/db";

/**
 * In-app notification. The SMS and email hooks are intentionally no-ops until
 * credentials are configured — see src/lib/messaging.ts.
 */
export async function notify(params: {
  userId: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
    },
  });
}

export async function notifyMany(userIds: string[], params: { title: string; body: string; link?: string | null }) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
    })),
  });
}

export async function notifyStaff(params: { title: string; body: string; link?: string | null }) {
  const staff = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { isStaff: true } },
    select: { id: true },
  });
  await notifyMany(staff.map((s) => s.id), params);
}
