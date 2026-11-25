import Link from "next/link";
import { AlertTriangle, BarChart3, CreditCard, FileText, GraduationCap, Package, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS, can } from "@/lib/permissions";
import { StatCard } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export const dynamic = "force-dynamic";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff(PERMISSIONS.DASHBOARD_VIEW);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { denied } = await searchParams;

  const today = startOfDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 864e5);

  const [
    todayOrders,
    monthOrders,
    todayServiceOrders,
    monthServiceOrders,
    pendingApplications,
    completedApplications,
    customers,
    students,
    products,
    lowStock,
    todayExpenses,
    monthExpenses,
    pendingPayments,
    recentOrders,
    recentServiceOrders,
    monthEnrollments,
  ] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.application.count({ where: { status: { in: ["PENDING", "PAYMENT_PENDING", "PROCESSING", "IN_REVIEW", "NEED_MORE_INFO"] } } }),
    prisma.application.count({ where: { status: { in: ["COMPLETED", "DELIVERED"] } } }),
    prisma.user.count({ where: { role: { isStaff: false } } }),
    prisma.enrollment.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({ where: { active: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 5 }),
    prisma.expense.aggregate({ where: { spentAt: { gte: today } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { spentAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.findMany({ where: { status: "PENDING" }, include: { payer: { select: { name: true } }, order: { select: { orderNo: true } }, serviceOrder: { select: { orderNo: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({ include: { customer: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.serviceOrder.findMany({ include: { service: true, customer: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthStart } } }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0) + todayServiceOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0) + monthServiceOrders.reduce((s, o) => s + o.total, 0);
  const monthProfit = monthRevenue - (monthExpenses._sum.amount ?? 0);

  const series = Array.from({ length: 30 }).map((_, index) => {
    const day = new Date(thirtyDaysAgo.getTime() + index * 864e5);
    const key = day.toISOString().slice(0, 10);
    const revenue =
      monthOrders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).reduce((s, o) => s + o.total, 0) +
      monthServiceOrders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).reduce((s, o) => s + o.total, 0);
    return {
      date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(day),
      revenue,
      orders: 0,
    };
  });

  return (
    <div className="space-y-5">
      {denied ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{d.admin.denied}</p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{bn ? "ব্যবসার সারসংক্ষেপ" : "Business overview"}</h2>
          <p className="text-xs text-muted">{formatDate(new Date(), locale)}</p>
        </div>
        <Link href="/admin/reports" className="btn btn-secondary btn-sm">
          <BarChart3 size={14} /> {d.admin.reports}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={d.admin.todaySales} value={formatTaka(todayRevenue, locale)} icon={<TrendingUp size={17} />} />
        <StatCard label={d.admin.monthRevenue} value={formatTaka(monthRevenue, locale)} icon={<Wallet size={17} />} tone="cyan" />
        <StatCard label={d.admin.monthProfit} value={formatTaka(monthProfit, locale)} hint={`${bn ? "খরচ" : "Expenses"}: ${formatTaka(monthExpenses._sum.amount ?? 0, locale)}`} icon={<BarChart3 size={17} />} tone={monthProfit >= 0 ? "success" : "danger"} />
        <StatCard label={d.admin.todayExpenses} value={formatTaka(todayExpenses._sum.amount ?? 0, locale)} icon={<CreditCard size={17} />} tone="warning" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={d.admin.totalOrders} value={String(monthOrders.length + monthServiceOrders.length)} hint={bn ? "এই মাসে" : "this month"} icon={<ShoppingBag size={17} />} />
        <StatCard label={d.admin.pendingApplications} value={String(pendingApplications)} icon={<FileText size={17} />} tone="warning" />
        <StatCard label={d.admin.completedApplications} value={String(completedApplications)} icon={<FileText size={17} />} tone="success" />
        <StatCard label={d.admin.totalCustomers} value={String(customers)} icon={<Users size={17} />} tone="navy" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={d.admin.totalStudents} value={String(students)} hint={`${bn ? "এ মাসে ভর্তি" : "admissions this month"}: ${monthEnrollments}`} icon={<GraduationCap size={17} />} />
        <StatCard label={d.admin.totalProducts} value={String(products)} icon={<Package size={17} />} />
        <StatCard label={d.admin.lowStock} value={String(lowStock.length)} icon={<AlertTriangle size={17} />} tone="danger" />
        <StatCard label={d.admin.pendingPayments} value={String(pendingPayments.length)} icon={<CreditCard size={17} />} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">{d.admin.revenueChart}</h3>
          <RevenueChart data={series} currencyLabel="৳" />
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{d.admin.lowStockAlert}</h3>
              <Link href="/admin/inventory" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link>
            </div>
            <ul className="space-y-2 text-sm">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-muted">{bn ? product.nameBn : product.nameEn}</span>
                  <span className="shrink-0 font-semibold text-danger">{product.stock}</span>
                </li>
              ))}
              {lowStock.length === 0 ? <li className="text-xs text-muted">{bn ? "সব পণ্যের স্টক ঠিক আছে।" : "All products are well stocked."}</li> : null}
            </ul>
          </div>

          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{d.admin.pendingPayments}</h3>
              {can(user, PERMISSIONS.PAYMENT_VERIFY) ? <Link href="/admin/payments" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link> : null}
            </div>
            <ul className="space-y-2 text-sm">
              {pendingPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-muted">
                    {payment.order?.orderNo ?? payment.serviceOrder?.orderNo ?? payment.reference} · {payment.method}
                  </span>
                  <span className="shrink-0 font-semibold">{formatTaka(payment.amount, locale)}</span>
                </li>
              ))}
              {pendingPayments.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো অপেক্ষমাণ পেমেন্ট নেই।" : "No pending payments."}</li> : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{d.admin.recentOrders}</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:border-royal/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.orderNo}</p>
                    <p className="text-[0.7rem] text-muted">{order.customer.name} · {formatTaka(order.total, locale)}</p>
                  </div>
                  <StatusBadge status={order.status} locale={locale} />
                </Link>
              </li>
            ))}
            {recentOrders.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো অর্ডার নেই।" : "No orders yet."}</li> : null}
          </ul>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{d.admin.serviceOrders}</h3>
            <Link href="/admin/service-orders" className="text-xs font-semibold text-royal">{d.common.viewAll}</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentServiceOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/service-orders/${order.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:border-royal/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.orderNo}</p>
                    <p className="text-[0.7rem] text-muted">{bn ? order.service.nameBn : order.service.nameEn}</p>
                  </div>
                  <StatusBadge status={order.status} locale={locale} />
                </Link>
              </li>
            ))}
            {recentServiceOrders.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো সেবা অর্ডার নেই।" : "No service orders yet."}</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
