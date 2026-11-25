import Link from "next/link";
import { ArrowRight, Bell, BookOpen, FileText, GraduationCap, LifeBuoy, ShoppingBag, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [orders, serviceOrders, applications, enrollments, unread, invoices, tickets] = await Promise.all([
    prisma.order.findMany({ where: { customerId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.serviceOrder.findMany({ where: { customerId: user.id }, include: { service: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.application.findMany({ where: { customerId: user.id }, include: { service: true }, orderBy: { submittedAt: "desc" }, take: 4 }),
    prisma.enrollment.findMany({ where: { studentId: user.id }, include: { course: true }, orderBy: { enrolledAt: "desc" } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.invoice.count({ where: { order: { customerId: user.id } } }),
    prisma.supportTicket.count({ where: { userId: user.id, status: { in: ["OPEN", "PENDING"] } } }),
  ]);

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0) + serviceOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{d.account.welcome}, {user.name.split(" ")[0]} 👋</h2>
        <p className="text-sm text-muted">{bn ? "আপনার সব কার্যক্রম এক জায়গায়।" : "Everything you have going on, in one place."}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={d.account.orders} value={String(orders.length + serviceOrders.length)} icon={<ShoppingBag size={17} />} />
        <StatCard label={d.account.applications} value={String(applications.length)} icon={<FileText size={17} />} tone="cyan" />
        <StatCard label={d.account.courses} value={String(enrollments.length)} icon={<GraduationCap size={17} />} tone="success" />
        <StatCard label={bn ? "মোট পরিশোধ" : "Total spent"} value={formatTaka(totalSpent, locale)} icon={<Wallet size={17} />} tone="navy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{d.account.orders}</h3>
            <Link href="/account/orders" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link>
          </div>
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-royal/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.orderNo}</p>
                    <p className="text-[0.7rem] text-muted">{formatDate(order.createdAt, locale)} · {formatTaka(order.total, locale)}</p>
                  </div>
                  <StatusBadge status={order.status} locale={locale} />
                </Link>
              </li>
            ))}
            {serviceOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/account/service-orders/${order.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-royal/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.orderNo}</p>
                    <p className="text-[0.7rem] text-muted">{bn ? order.service.nameBn : order.service.nameEn}</p>
                  </div>
                  <StatusBadge status={order.status} locale={locale} />
                </Link>
              </li>
            ))}
            {orders.length + serviceOrders.length === 0 ? (
              <li className="rounded-lg border border-dashed border-line-strong p-4 text-center text-xs text-muted">{d.account.noOrders}</li>
            ) : null}
          </ul>
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{d.account.applications}</h3>
            <Link href="/account/applications" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link>
          </div>
          <ul className="space-y-2">
            {applications.map((application) => (
              <li key={application.id}>
                <Link href={`/account/applications/${application.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-royal/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{application.trackingId}</p>
                    <p className="text-[0.7rem] text-muted">{bn ? application.service.nameBn : application.service.nameEn}</p>
                  </div>
                  <StatusBadge status={application.status} locale={locale} />
                </Link>
              </li>
            ))}
            {applications.length === 0 ? (
              <li className="rounded-lg border border-dashed border-line-strong p-4 text-center text-xs text-muted">{d.account.noApplications}</li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/account/notifications", label: d.account.notifications, value: unread, icon: Bell },
          { href: "/account/invoices", label: d.account.invoices, value: invoices, icon: FileText },
          { href: "/account/tickets", label: d.account.tickets, value: tickets, icon: LifeBuoy },
          { href: "/account/library", label: d.account.library, value: enrollments.length, icon: BookOpen },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card card-hover flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal-soft text-royal"><item.icon size={16} /></span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted">{item.value} <ArrowRight size={12} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
