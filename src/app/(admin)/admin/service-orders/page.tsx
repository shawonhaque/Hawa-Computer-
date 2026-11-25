import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { SERVICE_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaff(PERMISSIONS.ORDER_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { status, q } = await searchParams;

  const orders = await prisma.serviceOrder.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q ? { OR: [{ orderNo: { contains: q, mode: "insensitive" } }, { customer: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    include: { service: true, customer: { select: { name: true } }, assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={d.admin.serviceOrders} description={bn ? "ফটো, ডকুমেন্ট ও প্রিন্ট অর্ডার।" : "Photo, document and printing orders."} />

      <form action="/admin/service-orders" method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder={bn ? "অর্ডার আইডি বা গ্রাহক" : "Order ID or customer"} className="input max-w-xs" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-44">
          <option value="">{d.common.all}</option>
          {SERVICE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
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
                <th>{d.nav.services}</th>
                <th>{d.admin.customers}</th>
                <th>{d.common.total}</th>
                <th>{d.common.status}</th>
                <th>{bn ? "দায়িত্বপ্রাপ্ত" : "Assigned"}</th>
                <th>{d.common.date}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.orderNo}</td>
                  <td className="text-muted">{bn ? order.service.nameBn : order.service.nameEn}</td>
                  <td className="text-muted">{order.customer.name}</td>
                  <td className="font-semibold">{formatTaka(order.total, locale)}</td>
                  <td><StatusBadge status={order.status} locale={locale} /></td>
                  <td className="text-muted">{order.assignedTo?.name ?? "—"}</td>
                  <td className="text-muted">{formatDate(order.createdAt, locale)}</td>
                  <td className="text-right"><Link href={`/admin/service-orders/${order.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
