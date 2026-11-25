import Link from "next/link";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountInvoicesPage() {
  const user = await requireUser("/account/invoices");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const invoices = await prisma.invoice.findMany({
    where: { order: { customerId: user.id } },
    include: { order: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.account.invoices} />
      {invoices.length === 0 ? (
        <EmptyState icon={<Receipt size={22} />} title={bn ? "কোনো ইনভয়েস নেই" : "No invoices yet"} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{d.order.invoice}</th>
                <th>{d.order.orderNo}</th>
                <th>{d.common.date}</th>
                <th>{d.common.total}</th>
                <th>{d.common.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium">{invoice.number}</td>
                  <td className="text-muted">{invoice.order.orderNo}</td>
                  <td className="text-muted">{formatDate(invoice.issuedAt, locale)}</td>
                  <td className="font-semibold">{formatTaka(invoice.total, locale)}</td>
                  <td><StatusBadge status={invoice.order.paymentStatus} locale={locale} /></td>
                  <td className="text-right">
                    <Link href={`/account/invoices/${invoice.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
