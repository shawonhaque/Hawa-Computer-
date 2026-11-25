import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteExpense, saveExpense } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Rent", "Utilities", "Salary", "Supplies", "Internet", "Transport", "Marketing", "Maintenance", "Other"];

export default async function AdminExpensesPage() {
  await requireStaff(PERMISSIONS.FINANCE_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ orderBy: { spentAt: "desc" }, take: 100 }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.expenses} description={`${bn ? "মোট" : "Total"}: ${formatTaka(total._sum.amount ?? 0, locale)}`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <form action={saveExpense} className="card h-fit space-y-3 p-4">
          <h2 className="text-sm font-semibold">{bn ? "খরচ যোগ করুন" : "Add expense"}</h2>
          <div>
            <Label htmlFor="category" required>{bn ? "খাত" : "Category"}</Label>
            <Select id="category" name="category" required>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" required>{bn ? "পরিমাণ" : "Amount"}</Label>
            <Input id="amount" name="amount" type="number" min={1} required />
          </div>
          <div>
            <Label htmlFor="spentAt">{bn ? "তারিখ" : "Date"}</Label>
            <Input id="spentAt" name="spentAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <Textarea name="note" rows={2} placeholder={bn ? "নোট" : "Note"} />
          <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
        </form>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{bn ? "খাত" : "Category"}</th><th>{bn ? "নোট" : "Note"}</th><th>{bn ? "পরিমাণ" : "Amount"}</th><th>{d.common.date}</th><th /></tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="font-medium">{expense.category}</td>
                  <td className="text-muted">{expense.note ?? "—"}</td>
                  <td className="font-semibold">{formatTaka(expense.amount, locale)}</td>
                  <td className="text-muted">{formatDate(expense.spentAt, locale)}</td>
                  <td className="text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
                      <SubmitButton variant="ghost" size="sm" className="text-danger" pendingLabel="…">{d.common.delete}</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 ? <tr><td colSpan={5} className="text-center text-xs text-muted">{bn ? "কোনো খরচ নেই।" : "No expenses yet."}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
