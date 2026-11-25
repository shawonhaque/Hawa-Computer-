"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | null;

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!rateLimit(clientKey("login", ip), 10, 60_000).ok) return { error: "rate_limited" };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "invalid_input", fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { role: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "invalid_credentials" };
  }
  if (user.status !== "ACTIVE") return { error: "account_suspended" };

  await createSession(user.id);
  await audit({ userId: user.id, action: "login", entity: "user", entityId: user.id, ip });

  const next = safeNext(formData.get("next"));
  redirect(next ?? (user.role.isStaff ? "/admin" : "/account"));
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!rateLimit(clientKey("register", ip), 6, 60_000).ok) return { error: "rate_limited" };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "invalid_input", fieldErrors };
  }

  const data = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
    select: { id: true },
  });
  if (existing) return { error: "email_exists" };

  const role = await prisma.role.findUnique({ where: { slug: "customer" } });
  if (!role) return { error: "setup_incomplete" };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      roleId: role.id,
      profile: { create: {} },
    },
  });

  await createSession(user.id);
  await audit({ userId: user.id, action: "register", entity: "user", entityId: user.id, ip });
  redirect("/account?flash=registered");
}

export async function logout() {
  await destroySession();
  redirect("/?flash=logged_out");
}
