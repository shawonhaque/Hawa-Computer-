import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, FileText, Upload } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { paymentMethods, paymentLabels } from "@/lib/payments";
import { StatusBadge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/site/order-forms";
import { SubmitButton } from "@/components/ui/submit-button";
import { uploadApplicationDocuments } from "@/actions/applications";

export const dynamic = "force-dynamic";

export default async function AccountApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/applications/${id}`);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const application = await prisma.application.findFirst({
    where: { id, customerId: user.id },
    include: {
      service: true,
      documents: { include: { file: true } },
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();

  const formData = (application.formData as Record<string, string>) ?? {};
  const fields = (application.service.formFields as { name: string; labelBn: string; labelEn: string }[]) ?? [];
  const paid = application.payments.filter((p) => p.status === "VERIFIED").reduce((sum, p) => sum + p.amount, 0);
  const price = application.service.price;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/applications" className="text-xs text-muted hover:text-royal">← {d.account.applications}</Link>
          <h2 className="mt-1 text-xl font-bold">{application.trackingId}</h2>
          <p className="text-sm">{bn ? application.service.nameBn : application.service.nameEn}</p>
          <p className="text-xs text-muted">{formatDateTime(application.submittedAt, locale)}</p>
        </div>
        <StatusBadge status={application.status} locale={locale} />
      </div>

      {application.internalNote ? (
        <div className="rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-muted">
          <p className="font-semibold text-warning">{bn ? "আমাদের নোট" : "Note from our team"}</p>
          <p className="mt-1">{application.internalNote}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{bn ? "জমা দেওয়া তথ্য" : "Submitted information"}</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-[0.7rem] text-muted">{bn ? field.labelBn : field.labelEn}</dt>
                  <dd className="break-words font-medium">{formData[field.name] || "—"}</dd>
                </div>
              ))}
              {fields.length === 0
                ? Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-surface-2 px-3 py-2">
                      <dt className="text-[0.7rem] capitalize text-muted">{key}</dt>
                      <dd className="break-words font-medium">{value || "—"}</dd>
                    </div>
                  ))
                : null}
            </dl>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{bn ? "কাগজপত্র" : "Documents"}</h3>
            <ul className="space-y-2 text-sm">
              {application.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-muted" /> <span className="truncate">{doc.label}</span></span>
                  <a href={`/api/files/${doc.file.id}`} target="_blank" rel="noreferrer" className="text-royal"><Download size={13} /></a>
                </li>
              ))}
              {application.documents.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো ডকুমেন্ট নেই।" : "No documents uploaded."}</li> : null}
            </ul>

            <form action={uploadApplicationDocuments} className="mt-4 space-y-2 border-t border-line pt-3" encType="multipart/form-data">
              <input type="hidden" name="applicationId" value={application.id} />
              <label htmlFor="extraDocs" className="label">{bn ? "আরও ডকুমেন্ট আপলোড করুন" : "Upload more documents"}</label>
              <input
                id="extraDocs"
                name="doc:Additional document"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="block w-full cursor-pointer rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-royal-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-royal"
              />
              <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>
                <Upload size={14} /> {d.common.upload}
              </SubmitButton>
            </form>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{d.order.timeline}</h3>
            <ol className="space-y-3">
              {application.history.map((event) => (
                <li key={event.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-royal" />
                  <div>
                    <p className="font-medium">{event.toStatus.replaceAll("_", " ")}</p>
                    <p className="text-[0.7rem] text-muted">{formatDateTime(event.createdAt, locale)}{event.note ? ` · ${event.note}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">{bn ? "সেবা ফি" : "Service fee"}</span><span>{formatTaka(price, locale)}</span></div>
            <div className="mt-1 flex justify-between text-xs"><span className="text-muted">{bn ? "পরিশোধিত" : "Paid"}</span><span>{formatTaka(paid, locale)}</span></div>
          </div>

          {paid < price && application.status !== "CANCELLED" ? (
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold">{d.order.payNow}</h3>
              <PaymentForm
                locale={locale}
                labels={paymentLabels(locale)}
                applicationId={application.id}
                amount={Math.max(1, price - paid)}
                returnTo={`/account/applications/${application.id}`}
                methods={paymentMethods(locale)}
              />
            </div>
          ) : null}

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট" : "Payments"}</h3>
            <ul className="space-y-2 text-xs">
              {application.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-2">
                  <span>{payment.method} · {formatTaka(payment.amount, locale)}</span>
                  <StatusBadge status={payment.status} locale={locale} />
                </li>
              ))}
              {application.payments.length === 0 ? <li className="text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments yet."}</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
