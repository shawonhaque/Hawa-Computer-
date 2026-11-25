import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { verifyPayment } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff(PERMISSIONS.PAYMENT_VERIFY);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { status } = await searchParams;

  const payments = await prisma.payment.findMany({
    where: status ? { status: status as never } : {},
    include: {
      payer: { select: { name: true } },
      order: { select: { orderNo: true } },
      serviceOrder: { select: { orderNo: true } },
      application: { select: { trackingId: true } },
      screenshot: true,
      verifiedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={d.admin.payments} description={bn ? "ম্যানুয়াল যাচাই: ট্রানজেকশন মিলিয়ে পেমেন্ট নিশ্চিত করুন।" : "Manual verification: match the transaction before confirming."} />
      <form action="/admin/payments" method="get" className="mb-4 flex gap-2">
        <Select name="status" defaultValue={status ?? ""} className="max-w-44">
          <option value="">{d.common.all}</option>
          <option value="PENDING">PENDING</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="REJECTED">REJECTED</option>
        </Select>
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.filter}</button>
      </form>

      {payments.length === 0 ? (
        <EmptyState title={bn ? "কোনো পেমেন্ট নেই" : "No payments"} body={d.empty.body} />
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div key={payment.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">{payment.method} · {formatTaka(payment.amount, locale)}</p>
                  <p className="text-[0.7rem] text-muted">{payment.payer?.name ?? "—"} · {payment.payerNumber ?? "—"} · TrxID {payment.trxId ?? "—"}</p>
                  <p className="text-[0.7rem] text-muted">
                    {payment.order ? `Order ${payment.order.orderNo}` : payment.serviceOrder ? `Service ${payment.serviceOrder.orderNo}` : payment.application ? `Application ${payment.application.trackingId}` : payment.reference}
                    {" · "}{formatDateTime(payment.createdAt, locale)}
                  </p>
                  {payment.verifiedBy ? <p className="text-[0.65rem] text-muted">{bn ? "যাচাই" : "Verified by"}: {payment.verifiedBy.name}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {payment.screenshot ? <a href={`/api/files/${payment.screenshot.id}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-royal">{bn ? "স্ক্রিনশট" : "Screenshot"}</a> : null}
                  <StatusBadge status={payment.status} locale={locale} />
                </div>
              </div>
              {payment.status === "PENDING" ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <form action={verifyPayment}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="returnTo" value="/admin/payments" />
                    <input type="hidden" name="decision" value="VERIFY" />
                    <SubmitButton size="sm" pendingLabel="…">{bn ? "যাচাই করুন" : "Verify payment"}</SubmitButton>
                  </form>
                  <form action={verifyPayment} className="flex gap-1.5">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="returnTo" value="/admin/payments" />
                    <input type="hidden" name="decision" value="REJECT" />
                    <input name="note" placeholder={bn ? "কারণ" : "Reason"} className="input h-8 max-w-52 text-xs" />
                    <SubmitButton variant="secondary" size="sm" pendingLabel="…">{bn ? "বাতিল" : "Reject"}</SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
