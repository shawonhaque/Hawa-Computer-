import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { PERMISSIONS, can, type Permission, type SessionUser } from "@/lib/permissions";

export const SESSION_COOKIE = "hc_session";
const SESSION_DAYS = 30;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);

  await prisma.session.create({
    data: {
      token,
      userId,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  jar.delete(SESSION_COOKIE);
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { role: true } } },
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone,
    avatarUrl: session.user.avatarUrl,
    locale: session.user.locale,
    role: {
      id: session.user.role.id,
      slug: session.user.role.slug,
      name: session.user.role.name,
      isStaff: session.user.role.isStaff,
      permissions: (session.user.role.permissions as string[]) ?? [],
    },
  };
});

export async function requireUser(returnTo = "/account") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireStaff(permission?: Permission, returnTo = "/admin") {
  const user = await requireUser(returnTo);
  if (!user.role.isStaff) redirect("/account");
  if (permission && !can(user, permission)) {
    // Roles without dashboard access would otherwise loop between /admin and its guard.
    redirect(permission === PERMISSIONS.DASHBOARD_VIEW ? "/account?denied=1" : "/admin?denied=1");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!can(user, permission)) throw new Error("FORBIDDEN");
  return user;
}
