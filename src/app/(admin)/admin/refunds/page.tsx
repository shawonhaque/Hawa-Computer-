import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { decideRefund } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  await requireStaff(PERMISSIONS.REFUND_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const refunds = await prisma.refund.findMany({
    include: { payment: { include: { payer: { select: { name: true } } } }, order: { select: { orderNo: true } }, processedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.admin.refunds} description={bn ? "রিফান্ড অনুরোধ পর্যালোচনা ও অনুমোদন।" : "Review and approve refund requests."} />
      {refunds.length === 0 ? (
        <EmptyState title={bn ? "কোনো রিফান্ড অনুরোধ নেই" : "No refund requests"} body={d.empty.body} />
      ) : (
        <div className="space-y-2">
          {refunds.map((refund) => (
            <div key={refund.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">{formatTaka(refund.amount, locale)} · {refund.order?.orderNo ?? refund.payment.reference}</p>
                  <p className="text-[0.7rem] text-muted">{refund.payment.payer?.name ?? "—"} · {formatDateTime(refund.createdAt, locale)}</p>
                  <p className="mt-1 text-xs text-muted">{refund.reason}</p>
                  {refund.processedBy ? <p className="text-[0.65rem] text-muted">{bn ? "প্রসেস" : "Processed by"}: {refund.processedBy.name}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={refund.status} locale={locale} />
                  {refund.status === "PENDING" ? (
                    <>
                      <form action={decideRefund}>
                        <input type="hidden" name="refundId" value={refund.id} />
                        <input type="hidden" name="decision" value="APPROVE" />
                        <SubmitButton size="sm" pendingLabel="…">{bn ? "অনুমোদন" : "Approve"}</SubmitButton>
                      </form>
                      <form action={decideRefund}>
                        <input type="hidden" name="refundId" value={refund.id} />
                        <input type="hidden" name="decision" value="REJECT" />
                        <SubmitButton variant="secondary" size="sm" pendingLabel="…">{bn ? "বাতিল" : "Reject"}</SubmitButton>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
