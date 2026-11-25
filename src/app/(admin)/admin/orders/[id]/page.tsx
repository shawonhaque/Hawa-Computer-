import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { PERMISSIONS, can } from "@/lib/permissions";
import { ORDER_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateShopOrderStatus, verifyPayment } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff(PERMISSIONS.ORDER_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const order = await prisma.order.findFirst({
    where: { id },
    include: { items: true, customer: true, payments: { include: { payer: true, screenshot: true }, orderBy: { createdAt: "desc" } }, invoice: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-xs text-muted hover:text-royal">← {d.admin.orders}</Link>
          <h2 className="mt-1 text-xl font-bold">{order.orderNo}</h2>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} locale={locale} />
          <StatusBadge status={order.paymentStatus} locale={locale} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>{d.order.items}</th><th>SKU</th><th>{d.common.quantity}</th><th>{d.common.price}</th><th className="text-right">{d.common.total}</th></tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-muted">{item.sku ?? "—"}</td>
                    <td>{item.quantity}</td>
                    <td>{formatTaka(item.unitPrice, locale)}</td>
                    <td className="text-right font-semibold">{formatTaka(item.total, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card space-y-2 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">{d.common.subtotal}</span><span>{formatTaka(order.subtotal, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{d.common.delivery}</span><span>{formatTaka(order.deliveryFee, locale)}</span></div>
            {order.discount > 0 ? <div className="flex justify-between"><span className="text-muted">{d.common.discount}</span><span>−{formatTaka(order.discount, locale)}</span></div> : null}
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>{d.common.total}</span><span className="text-royal">{formatTaka(order.total, locale)}</span></div>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট" : "Payments"}</h3>
            <ul className="space-y-2">
              {order.payments.map((payment) => (
                <li key={payment.id} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{payment.method} · {formatTaka(payment.amount, locale)}</p>
                      <p className="text-[0.7rem] text-muted">
                        {payment.reference} {payment.trxId ? `· TrxID ${payment.trxId}` : ""} {payment.payerNumber ? `· ${payment.payerNumber}` : ""}
                      </p>
                      <p className="text-[0.7rem] text-muted">{formatDateTime(payment.createdAt, locale)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.screenshot ? <a href={`/api/files/${payment.screenshot.id}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-royal">{bn ? "স্ক্রিনশট" : "Screenshot"}</a> : null}
                      <StatusBadge status={payment.status} locale={locale} />
                    </div>
                  </div>
                  {payment.status === "PENDING" && can(user, PERMISSIONS.PAYMENT_VERIFY) ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form action={verifyPayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="returnTo" value={`/admin/orders/${order.id}`} />
                        <input type="hidden" name="decision" value="VERIFY" />
                        <SubmitButton size="sm" pendingLabel={d.common.loading}>{bn ? "যাচাই করুন" : "Verify"}</SubmitButton>
                      </form>
                      <form action={verifyPayment} className="flex gap-1">
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="returnTo" value={`/admin/orders/${order.id}`} />
                        <input type="hidden" name="decision" value="REJECT" />
                        <input name="note" placeholder={bn ? "কারণ" : "Reason"} className="input h-8 max-w-40 text-xs" />
                        <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>{bn ? "বাতিল" : "Reject"}</SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
              {order.payments.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments yet."}</li> : null}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <h3 className="mb-2 font-semibold">{bn ? "গ্রাহক ও ডেলিভারি" : "Customer & delivery"}</h3>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-xs text-muted">{order.customer.email}</p>
            <p className="text-xs text-muted">{order.phone}</p>
            <p className="mt-2 text-xs text-muted">{order.receiverName} · {order.address}, {order.city}</p>
            {order.notes ? <p className="mt-2 rounded-lg bg-surface-2 p-2 text-xs text-muted">{order.notes}</p> : null}
          </div>

          {order.invoice ? (
            <Link href={`/account/invoices/${order.invoice.id}`} className="card block p-4 text-sm hover:border-royal/40">
              {d.order.invoice} {order.invoice.number}
            </Link>
          ) : null}

          {can(user, PERMISSIONS.ORDER_MANAGE) ? (
            <form action={updateShopOrderStatus} className="card space-y-2 p-4">
              <input type="hidden" name="orderId" value={order.id} />
              <h3 className="text-sm font-semibold">{bn ? "স্ট্যাটাস পরিবর্তন" : "Update status"}</h3>
              <Select name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <SubmitButton size="sm" pendingLabel={d.common.loading}>{d.common.update}</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
