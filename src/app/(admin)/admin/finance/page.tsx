import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatCard } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  await requireStaff(PERMISSIONS.FINANCE_VIEW);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [shopOrders, serviceOrders, enrollments, expenses, yearExpenses, refunds] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: yearStart }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: yearStart }, status: { not: "CANCELLED" } }, select: { total: true, createdAt: true } }),
    prisma.enrollment.findMany({ where: { enrolledAt: { gte: yearStart } }, select: { feePaid: true, enrolledAt: true } }),
    prisma.expense.findMany({ where: { spentAt: { gte: monthStart } }, select: { amount: true, category: true } }),
    prisma.expense.findMany({ where: { spentAt: { gte: yearStart } }, select: { amount: true } }),
    prisma.refund.findMany({ where: { status: "APPROVED" }, select: { amount: true } }),
  ]);

  const monthShop = shopOrders.filter((o) => o.createdAt >= monthStart).reduce((s, o) => s + o.total, 0);
  const monthService = serviceOrders.filter((o) => o.createdAt >= monthStart).reduce((s, o) => s + o.total, 0);
  const monthTraining = enrollments.filter((e) => e.enrolledAt >= monthStart).reduce((s, e) => s + e.feePaid, 0);
  const monthExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const monthIncome = monthShop + monthService + monthTraining;
  const monthProfit = monthIncome - monthExpense;

  const yearShop = shopOrders.reduce((s, o) => s + o.total, 0);
  const yearService = serviceOrders.reduce((s, o) => s + o.total, 0);
  const yearTraining = enrollments.reduce((s, e) => s + e.feePaid, 0);
  const yearExpense = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const refundTotal = refunds.reduce((s, r) => s + r.amount, 0);

  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{d.admin.finance}</h2>
        <p className="text-xs text-muted">{bn ? "এই মাসের আয়-ব্যয়ের সারসংক্ষেপ।" : "Income and expense summary for this month."}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={bn ? "মাসিক আয়" : "Monthly income"} value={formatTaka(monthIncome, locale)} tone="success" />
        <StatCard label={bn ? "মাসিক খরচ" : "Monthly expense"} value={formatTaka(monthExpense, locale)} tone="warning" />
        <StatCard label={bn ? "মাসিক লাভ" : "Monthly profit"} value={formatTaka(monthProfit, locale)} tone={monthProfit >= 0 ? "success" : "danger"} />
        <StatCard label={bn ? "মোট রিফান্ড" : "Refunds"} value={formatTaka(refundTotal, locale)} tone="danger" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">{bn ? "আয়ের উৎস (এই মাস)" : "Income by stream (this month)"}</h3>
          <ul className="space-y-2 text-sm">
            {[
              { label: bn ? "পণ্য বিক্রি" : "Product sales", value: monthShop },
              { label: bn ? "সেবা" : "Services", value: monthService },
              { label: bn ? "প্রশিক্ষণ ফি" : "Training fees", value: monthTraining },
            ].map((row) => (
              <li key={row.label} className="flex justify-between border-b border-line pb-2 last:border-0">
                <span className="text-muted">{row.label}</span>
                <span className="font-semibold">{formatTaka(row.value, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">{bn ? "খরচের খাত (এই মাস)" : "Expenses by category (this month)"}</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(expenseByCategory).map(([category, value]) => (
              <li key={category} className="flex justify-between border-b border-line pb-2 last:border-0">
                <span className="text-muted">{category}</span>
                <span className="font-semibold">{formatTaka(value, locale)}</span>
              </li>
            ))}
            {Object.keys(expenseByCategory).length === 0 ? <li className="text-xs text-muted">{bn ? "এই মাসে কোনো খরচ নেই।" : "No expenses this month."}</li> : null}
          </ul>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold">{bn ? "বছরের সারসংক্ষেপ" : "Year to date"}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: bn ? "পণ্য" : "Products", value: yearShop },
            { label: bn ? "সেবা" : "Services", value: yearService },
            { label: bn ? "প্রশিক্ষণ" : "Training", value: yearTraining },
            { label: bn ? "খরচ" : "Expenses", value: yearExpense },
            { label: bn ? "নিট" : "Net", value: yearShop + yearService + yearTraining - yearExpense },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-surface-2 p-3">
              <p className="text-[0.7rem] text-muted">{row.label}</p>
              <p className="text-sm font-bold">{formatTaka(row.value, locale)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
