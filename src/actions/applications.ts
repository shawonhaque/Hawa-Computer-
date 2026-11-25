"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { newTrackingId } from "@/lib/ids";
import { saveUpload } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { notify, notifyStaff } from "@/actions/notify";
import { toStr } from "@/lib/utils";

type FieldDef = { name: string; labelBn: string; labelEn: string; type: string; required: boolean };

export async function createApplication(formData: FormData) {
  const slug = toStr(formData.get("slug"));
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/applications/${slug}`)}`);

  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service || !service.active) redirect("/applications?flash=not_found");

  const consent = formData.get("consent") === "on";
  if (service.requiresConsent && !consent) {
    redirect(`/applications/${slug}?flash=invalid_input&detail=consent`);
  }

  const fields = (service.formFields as unknown as FieldDef[]) ?? [];
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.name] = toStr(formData.get(field.name));
  }
  const missing = fields.filter((field) => field.required && !values[field.name]);
  if (missing.length > 0) {
    redirect(`/applications/${slug}?flash=invalid_input&detail=${encodeURIComponent(missing[0].name)}`);
  }

  const application = await prisma.application.create({
    data: {
      trackingId: newTrackingId(),
      customerId: user.id,
      serviceId: service.id,
      formData: values,
      consentAt: new Date(),
      customerNote: toStr(formData.get("customerNote")) || null,
      status: "PENDING",
      history: { create: { toStatus: "PENDING", note: "Application submitted by customer" } },
    },
  });

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("doc:") || !(value instanceof File) || value.size === 0) continue;
    try {
      const stored = await saveUpload(value, user.id);
      await prisma.applicationDocument.create({
        data: { applicationId: application.id, fileId: stored.id, label: key.slice(4) || stored.originalName },
      });
    } catch {
      // Invalid files are skipped; the customer can upload them later from the dashboard.
    }
  }

  await notify({
    userId: user.id,
    title: "Application submitted",
    body: `Your application ${application.trackingId} has been received and is being reviewed.`,
    link: `/account/applications/${application.id}`,
  });
  await notifyStaff({
    title: "New application",
    body: `${service.nameEn} — ${application.trackingId}`,
    link: `/admin/applications/${application.id}`,
  });
  await audit({
    userId: user.id,
    action: "application.create",
    entity: "Application",
    entityId: application.id,
    meta: { service: service.slug },
  });

  revalidatePath("/account/applications");
  redirect(`/account/applications/${application.id}?flash=application_submitted`);
}

export async function uploadApplicationDocuments(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const applicationId = toStr(formData.get("applicationId"));
  const application = await prisma.application.findFirst({
    where: { id: applicationId, customerId: user.id },
  });
  if (!application) redirect("/account/applications?flash=not_found");

  let uploaded = 0;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("doc:") || !(value instanceof File) || value.size === 0) continue;
    try {
      const stored = await saveUpload(value, user.id);
      await prisma.applicationDocument.create({
        data: { applicationId: application.id, fileId: stored.id, label: key.slice(4) || stored.originalName },
      });
      uploaded += 1;
    } catch {
      redirect(`/account/applications/${applicationId}?flash=upload_failed`);
    }
  }

  if (uploaded === 0) redirect(`/account/applications/${applicationId}?flash=invalid_input`);

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: application.status === "NEED_MORE_INFO" ? "IN_REVIEW" : application.status,
      history: { create: { fromStatus: application.status, toStatus: "IN_REVIEW", note: "Customer uploaded requested documents" } },
    },
  });
  await notifyStaff({
    title: "Documents uploaded",
    body: `${application.trackingId} — ${uploaded} new file(s)`,
    link: `/admin/applications/${applicationId}`,
  });
  await audit({ userId: user.id, action: "application.documents.upload", entity: "Application", entityId: applicationId });

  revalidatePath(`/account/applications/${applicationId}`);
  redirect(`/account/applications/${applicationId}?flash=saved`);
}
