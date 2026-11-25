import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Package, Upload } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime, formatTaka } from "@/lib/utils";
import { PERMISSIONS, can } from "@/lib/permissions";
import { SERVICE_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { Label, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateServiceOrder, uploadDeliverable, verifyPayment } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff(PERMISSIONS.ORDER_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [order, staff] = await Promise.all([
    prisma.serviceOrder.findFirst({
      where: { id },
      include: {
        service: true,
        customer: true,
        assignedTo: { select: { id: true, name: true } },
        files: { include: { file: true } },
        history: { orderBy: { createdAt: "asc" } },
        payments: { include: { screenshot: true, payer: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({ where: { status: "ACTIVE", role: { isStaff: true } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!order) notFound();

  const details = (order.details as Record<string, string>) ?? {};
  const uploads = order.files.filter((f) => f.kind === "CUSTOMER_UPLOAD");
  const deliverables = order.files.filter((f) => f.kind === "DELIVERABLE");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/service-orders" className="text-xs text-muted hover:text-royal">← {d.admin.serviceOrders}</Link>
          <h2 className="mt-1 text-xl font-bold">{order.orderNo}</h2>
          <p className="text-sm">{bn ? order.service.nameBn : order.service.nameEn}</p>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <StatusBadge status={order.status} locale={locale} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <h3 className="mb-2 font-semibold">{bn ? "গ্রাহক" : "Customer"}</h3>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-xs text-muted">{order.customer.email} · {order.customer.phone ?? "—"}</p>
            <p className="mt-1 text-xs text-muted">{order.deliveryMethod === "DELIVERY" ? order.deliveryAddress : bn ? "দোকান থেকে সংগ্রহ" : "Shop pickup"}</p>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "অর্ডার তথ্য" : "Order details"}</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-[0.7rem] capitalize text-muted">{key.replaceAll("_", " ")}</dt>
                  <dd className="font-medium">{value || "—"}</dd>
                </div>
              ))}
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-[0.7rem] text-muted">{d.common.quantity}</dt>
                <dd className="font-medium">{order.quantity}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-[0.7rem] text-muted">{d.common.total}</dt>
                <dd className="font-medium">{formatTaka(order.total, locale)}</dd>
              </div>
            </dl>
            {order.instructions ? <p className="mt-3 rounded-lg border border-line p-2 text-xs text-muted">{order.instructions}</p> : null}
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "গ্রাহকের ফাইল" : "Customer files"}</h3>
            <ul className="space-y-2 text-sm">
              {uploads.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-muted" /> <span className="truncate">{item.file.originalName}</span></span>
                  <a href={`/api/files/${item.file.id}`} target="_blank" rel="noreferrer" className="text-royal"><Download size={14} /></a>
                </li>
              ))}
              {uploads.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো ফাইল নেই।" : "No files."}</li> : null}
            </ul>

            <form action={uploadDeliverable} className="mt-4 space-y-2 border-t border-line pt-3" encType="multipart/form-data">
              <input type="hidden" name="orderId" value={order.id} />
              <Label htmlFor="deliverable">{bn ? "সম্পন্ন ফাইল আপলোড" : "Upload completed files"}</Label>
              <input id="deliverable" name="file:Deliverable" type="file" multiple className="block w-full cursor-pointer rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-royal-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-royal" />
              <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}><Upload size={14} /> {d.common.upload}</SubmitButton>
            </form>

            {deliverables.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {deliverables.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2"><Package size={14} className="shrink-0 text-success" /> <span className="truncate">{item.file.originalName}</span></span>
                    <a href={`/api/files/${item.file.id}`} target="_blank" rel="noreferrer" className="text-success"><Download size={14} /></a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{d.order.timeline}</h3>
            <ol className="space-y-2 text-sm">
              {order.history.map((event) => (
                <li key={event.id} className="flex justify-between gap-2">
                  <span>{event.toStatus.replaceAll("_", " ")}{event.note ? ` · ${event.note}` : ""}</span>
                  <span className="shrink-0 text-[0.7rem] text-muted">{formatDateTime(event.createdAt, locale)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {can(user, PERMISSIONS.ORDER_MANAGE) ? (
            <form action={updateServiceOrder} className="card space-y-3 p-4">
              <input type="hidden" name="orderId" value={order.id} />
              <h3 className="text-sm font-semibold">{bn ? "কাজের অবস্থা" : "Work status"}</h3>
              <div>
                <Label htmlFor="status">{d.common.status}</Label>
                <Select id="status" name="status" defaultValue={order.status}>
                  {SERVICE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="assignedToId">{bn ? "দায়িত্ব দিন" : "Assign to"}</Label>
                <Select id="assignedToId" name="assignedToId" defaultValue={order.assignedToId ?? ""}>
                  <option value="">—</option>
                  {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="customerNote">{bn ? "গ্রাহককে নোট" : "Note to customer"}</Label>
                <Textarea id="customerNote" name="customerNote" rows={2} defaultValue={order.customerNote ?? ""} />
              </div>
              <div>
                <Label htmlFor="internalNote">{bn ? "অভ্যন্তরীণ নোট" : "Internal note"}</Label>
                <Textarea id="internalNote" name="internalNote" rows={2} defaultValue={order.internalNote ?? ""} />
              </div>
              <SubmitButton size="sm" pendingLabel={d.common.loading}>{d.common.update}</SubmitButton>
            </form>
          ) : null}

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{bn ? "পেমেন্ট" : "Payments"}</h3>
            <ul className="space-y-2 text-sm">
              {order.payments.map((payment) => (
                <li key={payment.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span>{payment.method} · {formatTaka(payment.amount, locale)}</span>
                    <StatusBadge status={payment.status} locale={locale} />
                  </div>
                  <p className="mt-1 text-[0.7rem] text-muted">{payment.trxId ?? payment.reference}</p>
                  {payment.status === "PENDING" && can(user, PERMISSIONS.PAYMENT_VERIFY) ? (
                    <div className="mt-2 flex gap-2">
                      <form action={verifyPayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="returnTo" value={`/admin/service-orders/${order.id}`} />
                        <input type="hidden" name="decision" value="VERIFY" />
                        <SubmitButton size="sm" pendingLabel={d.common.loading}>{bn ? "যাচাই" : "Verify"}</SubmitButton>
                      </form>
                      <form action={verifyPayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="returnTo" value={`/admin/service-orders/${order.id}`} />
                        <input type="hidden" name="decision" value="REJECT" />
                        <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>{bn ? "বাতিল" : "Reject"}</SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
              {order.payments.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো পেমেন্ট নেই।" : "No payments."}</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
