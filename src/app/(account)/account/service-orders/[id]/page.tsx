import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, FileText, Package, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { paymentMethods, paymentLabels } from "@/lib/payments";
import { StatusBadge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/site/order-forms";

export const dynamic = "force-dynamic";

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/service-orders/${id}`);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const order = await prisma.serviceOrder.findFirst({
    where: { id, customerId: user.id },
    include: {
      service: true,
      files: { include: { file: true } },
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const paid = order.payments.filter((p) => p.status === "VERIFIED").reduce((sum, p) => sum + p.amount, 0);
  const details = (order.details as Record<string, string>) ?? {};
  const uploads = order.files.filter((f) => f.kind === "CUSTOMER_UPLOAD");
  const deliverables = order.files.filter((f) => f.kind === "DELIVERABLE");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-xs text-muted hover:text-royal">← {d.account.orders}</Link>
          <h2 className="mt-1 text-xl font-bold">{order.orderNo}</h2>
          <p className="text-sm">{bn ? order.service.nameBn : order.service.nameEn}</p>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <StatusBadge status={order.status} locale={locale} />
      </div>

      {order.customerNote ? (
        <div className="rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-muted">
          <p className="font-semibold text-warning">{bn ? "আমাদের নোট" : "Note from our team"}</p>
          <p className="mt-1">{order.customerNote}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{bn ? "অর্ডার তথ্য" : "Order details"}</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-[0.7rem] capitalize text-muted">{key.replaceAll("_", " ")}</dt>
                  <dd className="break-words font-medium">{value || "—"}</dd>
                </div>
              ))}
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-[0.7rem] text-muted">{d.common.quantity}</dt>
                <dd className="font-medium">{order.quantity}</dd>
              </div>
            </dl>
            {order.instructions ? <p className="mt-3 rounded-lg border border-line p-2 text-xs text-muted">{order.instructions}</p> : null}
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{bn ? "ফাইল" : "Files"}</h3>
            <ul className="space-y-2 text-sm">
              {uploads.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-muted" /> <span className="truncate">{item.file.originalName}</span></span>
                  <a href={`/api/files/${item.file.id}`} target="_blank" rel="noreferrer" className="text-royal"><Download size={14} /></a>
                </li>
              ))}
              {deliverables.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2"><Package size={14} className="shrink-0 text-success" /> <span className="truncate">{item.file.originalName}</span></span>
                  <a href={`/api/files/${item.file.id}`} target="_blank" rel="noreferrer" className="text-success"><Download size={14} /></a>
                </li>
              ))}
              {uploads.length + deliverables.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো ফাইল নেই।" : "No files yet."}</li> : null}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{d.order.timeline}</h3>
            <ol className="space-y-3">
              {order.history.map((event) => (
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
            <div className="flex justify-between"><span className="text-muted">{d.common.price}</span><span>{formatTaka(order.unitPrice, locale)} × {order.quantity}</span></div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>{d.common.total}</span><span className="text-royal">{formatTaka(order.total, locale)}</span></div>
            <div className="mt-1 flex justify-between text-xs"><span className="text-muted">{bn ? "পরিশোধিত" : "Paid"}</span><span>{formatTaka(paid, locale)}</span></div>
            {order.deliveryMethod === "DELIVERY" ? (
              <p className="mt-2 flex items-start gap-1.5 text-[0.7rem] text-muted"><Truck size={12} className="mt-0.5" /> {order.deliveryAddress}</p>
            ) : null}
          </div>

          {paid < order.total && order.status !== "CANCELLED" ? (
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold">{d.order.payNow}</h3>
              <PaymentForm
                locale={locale}
                labels={paymentLabels(locale)}
                serviceOrderId={order.id}
                amount={Math.max(1, order.total - paid)}
                returnTo={`/account/service-orders/${order.id}`}
                methods={paymentMethods(locale)}
              />
            </div>
          ) : null}

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট" : "Payments"}</h3>
            <ul className="space-y-2 text-xs">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-2">
                  <span>{payment.method} · {formatTaka(payment.amount, locale)}</span>
                  <StatusBadge status={payment.status} locale={locale} />
                </li>
              ))}
              {order.payments.length === 0 ? <li className="text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments yet."}</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
