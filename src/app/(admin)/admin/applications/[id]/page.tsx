import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS, can } from "@/lib/permissions";
import { SERVICE_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { Label, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateApplicationStatus, verifyPayment } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff(PERMISSIONS.APPLICATION_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [application, staff] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        service: true,
        customer: true,
        assignedTo: { select: { id: true, name: true } },
        documents: { include: { file: true } },
        history: { orderBy: { createdAt: "asc" } },
        payments: { include: { screenshot: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({ where: { status: "ACTIVE", role: { isStaff: true } }, select: { id: true, name: true } }),
  ]);
  if (!application) notFound();

  const formData = (application.formData as Record<string, string>) ?? {};
  const fields = (application.service.formFields as { name: string; labelBn: string; labelEn: string }[]) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/applications" className="text-xs text-muted hover:text-royal">← {d.admin.applications}</Link>
          <h2 className="mt-1 text-xl font-bold">{application.trackingId}</h2>
          <p className="text-sm">{bn ? application.service.nameBn : application.service.nameEn}</p>
          <p className="text-xs text-muted">{formatDateTime(application.submittedAt, locale)}</p>
        </div>
        <StatusBadge status={application.status} locale={locale} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <h3 className="mb-2 font-semibold">{bn ? "গ্রাহক" : "Customer"}</h3>
            <p className="font-medium">{application.customer.name}</p>
            <p className="text-xs text-muted">{application.customer.email} · {application.customer.phone ?? "—"}</p>
            <p className="mt-1 text-xs text-muted">{bn ? "সম্মতি" : "Consent"}: {application.consentAt ? formatDateTime(application.consentAt, locale) : "—"}</p>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "আবেদনের তথ্য" : "Application data"}</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-[0.7rem] text-muted">{bn ? field.labelBn : field.labelEn}</dt>
                  <dd className="break-words font-medium">{formData[field.name] || "—"}</dd>
                </div>
              ))}
            </dl>
            {application.customerNote ? <p className="mt-2 rounded-lg border border-line p-2 text-xs text-muted">{application.customerNote}</p> : null}
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "ডকুমেন্ট" : "Documents"}</h3>
            <ul className="space-y-2 text-sm">
              {application.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-muted" /> <span className="truncate">{doc.label}</span></span>
                  <a href={`/api/files/${doc.file.id}`} target="_blank" rel="noreferrer" className="text-royal"><Download size={14} /></a>
                </li>
              ))}
              {application.documents.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো ডকুমেন্ট নেই।" : "No documents."}</li> : null}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{d.order.timeline}</h3>
            <ol className="space-y-2 text-sm">
              {application.history.map((event) => (
                <li key={event.id} className="flex justify-between gap-2">
                  <span>{event.toStatus.replaceAll("_", " ")}{event.note ? ` · ${event.note}` : ""}</span>
                  <span className="shrink-0 text-[0.7rem] text-muted">{formatDateTime(event.createdAt, locale)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {can(user, PERMISSIONS.APPLICATION_MANAGE) ? (
            <form action={updateApplicationStatus} className="card space-y-3 p-4">
              <input type="hidden" name="applicationId" value={application.id} />
              <h3 className="text-sm font-semibold">{bn ? "অগ্রগতি হালনাগাদ" : "Update progress"}</h3>
              <div>
                <Label htmlFor="status">{d.common.status}</Label>
                <Select id="status" name="status" defaultValue={application.status}>
                  {SERVICE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="assignedToId">{bn ? "দায়িত্ব দিন" : "Assign to"}</Label>
                <Select id="assignedToId" name="assignedToId" defaultValue={application.assignedToId ?? ""}>
                  <option value="">—</option>
                  {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="note">{bn ? "গ্রাহককে নোট" : "Note to customer"}</Label>
                <Textarea id="note" name="note" rows={2} />
              </div>
              <div>
                <Label htmlFor="internalNote">{bn ? "অভ্যন্তরীণ নোট" : "Internal note"}</Label>
                <Textarea id="internalNote" name="internalNote" rows={2} defaultValue={application.internalNote ?? ""} />
              </div>
              <SubmitButton size="sm" pendingLabel={d.common.loading}>{d.common.update}</SubmitButton>
            </form>
          ) : null}

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট" : "Payments"}</h3>
            <ul className="space-y-2 text-sm">
              {application.payments.map((payment) => (
                <li key={payment.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span>{payment.method} · {payment.amount}</span>
                    <StatusBadge status={payment.status} locale={locale} />
                  </div>
                  {payment.status === "PENDING" && can(user, PERMISSIONS.PAYMENT_VERIFY) ? (
                    <form action={verifyPayment} className="mt-2">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input type="hidden" name="returnTo" value={`/admin/applications/${application.id}`} />
                      <input type="hidden" name="decision" value="VERIFY" />
                      <SubmitButton size="sm" pendingLabel={d.common.loading}>{bn ? "যাচাই" : "Verify"}</SubmitButton>
                    </form>
                  ) : null}
                </li>
              ))}
              {application.payments.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments."}</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
