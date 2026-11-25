import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireStaff(PERMISSIONS.REPORT_VIEW);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { from, to } = await searchParams;

  const start = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = to ? new Date(new Date(to).getTime() + 864e5) : new Date();
  const range = { gte: start, lt: end };

  const [orders, serviceOrders, payments, expenses, enrollments, topProducts] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: range, status: { not: "CANCELLED" } }, include: { items: true } }),
    prisma.serviceOrder.findMany({ where: { createdAt: range, status: { not: "CANCELLED" } }, include: { service: true } }),
    prisma.payment.findMany({ where: { createdAt: range, status: "VERIFIED" } }),
    prisma.expense.findMany({ where: { spentAt: range } }),
    prisma.enrollment.findMany({ where: { enrolledAt: range }, include: { course: true } }),
    prisma.orderItem.groupBy({ by: ["name"], _sum: { total: true, quantity: true }, orderBy: { _sum: { total: "desc" } }, take: 8 }),
  ]);

  const productRevenue = orders.reduce((s, o) => s + o.total, 0);
  const serviceRevenue = serviceOrders.reduce((s, o) => s + o.total, 0);
  const trainingRevenue = enrollments.reduce((s, e) => s + e.feePaid, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const verifiedPayments = payments.reduce((s, p) => s + p.amount, 0);

  const serviceBreakdown = serviceOrders.reduce<Record<string, number>>((acc, order) => {
    const name = bn ? order.service.nameBn : order.service.nameEn;
    acc[name] = (acc[name] ?? 0) + order.total;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.admin.reports}
        description={`${formatDate(start, locale)} — ${formatDate(end, locale)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={`/api/admin/reports/export?type=orders&from=${start.toISOString()}&to=${end.toISOString()}`} className="btn btn-secondary btn-sm">CSV · Orders</a>
            <a href={`/api/admin/reports/export?type=payments&from=${start.toISOString()}&to=${end.toISOString()}`} className="btn btn-secondary btn-sm">CSV · Payments</a>
            <a href={`/api/admin/reports/export?type=expenses&from=${start.toISOString()}&to=${end.toISOString()}`} className="btn btn-secondary btn-sm">CSV · Expenses</a>
          </div>
        }
      >
        <form action="/admin/reports" method="get" className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="from" className="label">{d.common.from}</label>
            <input id="from" name="from" type="date" defaultValue={start.toISOString().slice(0, 10)} className="input h-9" />
          </div>
          <div>
            <label htmlFor="to" className="label">{d.common.to}</label>
            <input id="to" name="to" type="date" defaultValue={new Date(end.getTime() - 864e5).toISOString().slice(0, 10)} className="input h-9" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{d.common.filter}</button>
        </form>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: bn ? "পণ্য বিক্রি" : "Product sales", value: productRevenue },
          { label: bn ? "সেবা আয়" : "Service revenue", value: serviceRevenue },
          { label: bn ? "প্রশিক্ষণ" : "Training", value: trainingRevenue },
          { label: bn ? "যাচাইকৃত পেমেন্ট" : "Verified payments", value: verifiedPayments },
        ].map((row) => (
          <div key={row.label} className="card p-4">
            <p className="text-[0.7rem] uppercase tracking-wide text-muted">{row.label}</p>
            <p className="mt-1 text-lg font-bold">{formatTaka(row.value, locale)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">{bn ? "সেবা অনুযায়ী আয়" : "Revenue by service"}</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(serviceBreakdown).map(([name, value]) => (
              <li key={name} className="flex justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span className="truncate text-muted">{name}</span>
                <span className="shrink-0 font-semibold">{formatTaka(value, locale)}</span>
              </li>
            ))}
            {Object.keys(serviceBreakdown).length === 0 ? <li className="text-xs text-muted">{bn ? "এই সময়ে কোনো সেবা অর্ডার নেই।" : "No service orders in this period."}</li> : null}
          </ul>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">{bn ? "সর্বাধিক বিক্রীত পণ্য" : "Top products"}</h3>
          <ul className="space-y-2 text-sm">
            {topProducts.map((item) => (
              <li key={item.name} className="flex justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span className="truncate text-muted">{item.name}</span>
                <span className="shrink-0 font-semibold">{formatTaka(item._sum.total ?? 0, locale)}</span>
              </li>
            ))}
            {topProducts.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো পণ্য বিক্রি হয়নি।" : "No products sold."}</li> : null}
          </ul>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold">{bn ? "লাভ-ক্ষতি" : "Profit & loss"}</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span className="text-muted">{bn ? "মোট আয়" : "Total income"}</span><span className="font-semibold">{formatTaka(productRevenue + serviceRevenue + trainingRevenue, locale)}</span></li>
          <li className="flex justify-between"><span className="text-muted">{bn ? "মোট খরচ" : "Total expenses"}</span><span className="font-semibold">{formatTaka(expenseTotal, locale)}</span></li>
          <li className="flex justify-between border-t border-line pt-2"><span className="font-semibold">{bn ? "নিট" : "Net"}</span><span className="font-bold text-royal">{formatTaka(productRevenue + serviceRevenue + trainingRevenue - expenseTotal, locale)}</span></li>
        </ul>
      </div>
    </div>
  );
}
