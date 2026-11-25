import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [orders, serviceOrders] = await Promise.all([
    prisma.order.findMany({ where: { customerId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    prisma.serviceOrder.findMany({ where: { customerId: user.id }, include: { service: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title={d.account.orders} description={bn ? "শপ অর্ডার ও সেবা অর্ডার — সব একসাথে।" : "Shop orders and service orders, together."} />

      {orders.length === 0 && serviceOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title={d.account.noOrders}
          body={d.empty.body}
          action={<Link href="/shop" className="btn btn-primary btn-sm">{d.shop.allProducts}</Link>}
        />
      ) : (
        <div className="space-y-6">
          {orders.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold">{bn ? "শপ অর্ডার" : "Shop orders"}</h2>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{d.order.orderNo}</th>
                      <th>{d.common.date}</th>
                      <th>{d.order.items}</th>
                      <th>{d.common.total}</th>
                      <th>{d.common.status}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-medium">{order.orderNo}</td>
                        <td className="text-muted">{formatDate(order.createdAt, locale)}</td>
                        <td className="text-muted">{order.items.length}</td>
                        <td className="font-semibold">{formatTaka(order.total, locale)}</td>
                        <td><StatusBadge status={order.status} locale={locale} /></td>
                        <td className="text-right">
                          <Link href={`/account/orders/${order.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {serviceOrders.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold">{bn ? "সেবা অর্ডার" : "Service orders"}</h2>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{d.order.orderNo}</th>
                      <th>{d.nav.services}</th>
                      <th>{d.common.date}</th>
                      <th>{d.common.total}</th>
                      <th>{d.common.status}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {serviceOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-medium">{order.orderNo}</td>
                        <td className="text-muted">{bn ? order.service.nameBn : order.service.nameEn}</td>
                        <td className="text-muted">{formatDate(order.createdAt, locale)}</td>
                        <td className="font-semibold">{formatTaka(order.total, locale)}</td>
                        <td><StatusBadge status={order.status} locale={locale} /></td>
                        <td className="text-right">
                          <Link href={`/account/service-orders/${order.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
