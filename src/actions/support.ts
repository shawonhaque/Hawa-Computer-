"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { notifyStaff } from "@/actions/notify";
import { audit } from "@/lib/audit";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

export async function submitContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!rateLimit(clientKey("contact", ip), 5, 300_000).ok) return { error: "rate_limited" };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "invalid_input", fieldErrors };
  }

  await prisma.contactMessage.create({ data: { ...parsed.data, phone: parsed.data.phone || null } });
  await notifyStaff({
    title: "New contact message",
    body: `${parsed.data.name}: ${parsed.data.subject}`,
    link: "/admin/messages",
  });
  await audit({ action: "contact.create", entity: "ContactMessage", meta: { email: parsed.data.email }, ip });

  return { ok: true };
}
