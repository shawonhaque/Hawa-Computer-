import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, MapPin, Phone, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { paymentMethods, paymentLabels } from "@/lib/payments";
import { StatusBadge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/site/order-forms";
import { SubmitButton } from "@/components/ui/submit-button";
import { ClearCart } from "@/components/dashboard/clear-cart";
import { cancelOwnOrder, requestRefund } from "@/actions/orders";

export const dynamic = "force-dynamic";

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ flash?: string }> }) {
  const { id } = await params;
  const { flash } = await searchParams;
  const user = await requireUser(`/account/orders/${id}`);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const order = await prisma.order.findFirst({
    where: { id, customerId: user.id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } }, invoice: true, refunds: true },
  });
  if (!order) notFound();

  const paid = order.payments.filter((p) => p.status === "VERIFIED").reduce((sum, p) => sum + p.amount, 0);
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const labels = paymentLabels(locale);

  return (
    <div className="space-y-5">
      {flash === "order_placed" ? <ClearCart /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-xs text-muted hover:text-royal">← {d.account.orders}</Link>
          <h2 className="mt-1 text-xl font-bold">{order.orderNo}</h2>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} locale={locale} />
          <StatusBadge status={order.paymentStatus} locale={locale} />
        </div>
      </div>

      {stepIndex >= 0 ? (
        <div className="card p-4">
          <ol className="flex flex-wrap items-center gap-2 text-[0.7rem]">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                    index <= stepIndex ? "bg-royal text-white" : "bg-surface-2 text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={index <= stepIndex ? "font-semibold" : "text-muted"}>{step}</span>
                {index < STEPS.length - 1 ? <span className="mx-1 h-px w-6 bg-line-strong" /> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{d.order.items}</th>
                  <th>{d.common.quantity}</th>
                  <th>{d.common.price}</th>
                  <th className="text-right">{d.common.total}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
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
            {order.discount > 0 ? <div className="flex justify-between"><span className="text-muted">{d.common.discount} {order.couponCode}</span><span className="text-success">−{formatTaka(order.discount, locale)}</span></div> : null}
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>{d.common.total}</span><span className="text-royal">{formatTaka(order.total, locale)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted">{bn ? "পরিশোধিত" : "Paid"}</span><span>{formatTaka(paid, locale)}</span></div>
          </div>

          <div className="card p-4 text-sm">
            <h3 className="mb-2 font-semibold">{bn ? "ডেলিভারি তথ্য" : "Delivery details"}</h3>
            <p className="flex items-center gap-2 text-muted"><Truck size={14} /> {order.receiverName}</p>
            <p className="mt-1 flex items-center gap-2 text-muted"><Phone size={14} /> {order.phone}</p>
            <p className="mt-1 flex items-start gap-2 text-muted"><MapPin size={14} className="mt-0.5" /> {order.address}, {order.city}</p>
            {order.notes ? <p className="mt-2 rounded-lg bg-surface-2 p-2 text-xs text-muted">{order.notes}</p> : null}
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট ইতিহাস" : "Payment history"}</h3>
            <ul className="space-y-2 text-sm">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <div>
                    <p className="font-medium">{payment.method} · {formatTaka(payment.amount, locale)}</p>
                    <p className="text-[0.7rem] text-muted">{payment.trxId ?? payment.reference} · {formatDateTime(payment.createdAt, locale)}</p>
                    {payment.rejectionNote ? <p className="text-[0.7rem] text-danger">{payment.rejectionNote}</p> : null}
                  </div>
                  <StatusBadge status={payment.status} locale={locale} />
                </li>
              ))}
              {order.payments.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments yet."}</li> : null}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {order.invoice ? (
            <Link href={`/account/invoices/${order.invoice.id}`} className="card flex items-center justify-between p-4 text-sm hover:border-royal/40">
              <span className="flex items-center gap-2"><FileText size={15} /> {d.order.invoice} {order.invoice.number}</span>
              <Download size={15} className="text-royal" />
            </Link>
          ) : null}

          {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" ? (
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold">{d.order.payNow}</h3>
              <PaymentForm
                locale={locale}
                labels={labels}
                orderId={order.id}
                amount={Math.max(1, order.total - paid)}
                returnTo={`/account/orders/${order.id}`}
                methods={paymentMethods(locale)}
              />
            </div>
          ) : null}

          {["PENDING", "CONFIRMED"].includes(order.status) ? (
            <form action={cancelOwnOrder} className="card p-4">
              <input type="hidden" name="orderId" value={order.id} />
              <p className="mb-2 text-xs text-muted">{bn ? "অর্ডার প্যাক হওয়ার আগে বাতিল করতে পারবেন।" : "You can cancel before the order is packed."}</p>
              <SubmitButton variant="danger" size="sm" pendingLabel={d.common.loading}>{bn ? "অর্ডার বাতিল করুন" : "Cancel order"}</SubmitButton>
            </form>
          ) : null}

          {paid > 0 && !order.refunds.length ? (
            <form action={requestRefund} className="card space-y-2 p-4">
              <input type="hidden" name="orderId" value={order.id} />
              <h3 className="text-sm font-semibold">{bn ? "রিফান্ড অনুরোধ" : "Request a refund"}</h3>
              <input name="amount" type="number" min={1} max={paid} defaultValue={paid} className="input" required />
              <textarea name="reason" rows={2} className="textarea" placeholder={bn ? "কারণ" : "Reason"} required />
              <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>{d.common.submit}</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
