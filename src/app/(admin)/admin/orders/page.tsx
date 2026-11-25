import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { ORDER_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaff(PERMISSIONS.ORDER_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { status, q } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { orderNo: { contains: q, mode: "insensitive" } },
              { receiverName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: { items: true, customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={d.admin.orders} description={bn ? "শপ অর্ডার ব্যবস্থাপনা।" : "Manage shop orders."} />

      <form action="/admin/orders" method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder={bn ? "অর্ডার আইডি বা নাম" : "Order ID or name"} className="input max-w-xs" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-40">
          <option value="">{d.common.all}</option>
          {ORDER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.filter}</button>
      </form>

      {orders.length === 0 ? (
        <EmptyState title={d.common.noResults} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{d.order.orderNo}</th>
                <th>{d.admin.customers}</th>
                <th>{bn ? "আইটেম" : "Items"}</th>
                <th>{d.common.total}</th>
                <th>{d.common.status}</th>
                <th>{bn ? "পেমেন্ট" : "Payment"}</th>
                <th>{d.common.date}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.orderNo}</td>
                  <td className="text-muted">{order.customer.name}</td>
                  <td className="text-muted">{order.items.length}</td>
                  <td className="font-semibold">{formatTaka(order.total, locale)}</td>
                  <td><StatusBadge status={order.status} locale={locale} /></td>
                  <td><StatusBadge status={order.paymentStatus} locale={locale} /></td>
                  <td className="text-muted">{formatDate(order.createdAt, locale)}</td>
                  <td className="text-right"><Link href={`/admin/orders/${order.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
