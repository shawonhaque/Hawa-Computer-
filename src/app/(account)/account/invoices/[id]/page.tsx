import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate, formatTaka } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/invoices/${id}`);
  const locale = await getLocale();
  const bn = locale === "bn";
  const settings = await getSettings();

  const invoice = await prisma.invoice.findFirst({
    where: { id, order: { customerId: user.id } },
    include: { order: { include: { items: true, customer: true } } },
  });
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h2 className="text-lg font-bold">{bn ? "ইনভয়েস" : "Invoice"}</h2>
        <PrintButton label={bn ? "প্রিন্ট করুন" : "Print"} />
      </div>

      <div className="card p-6 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-lg font-bold">{bn ? settings.businessNameBn : settings.businessNameEn}</p>
            <p className="text-xs text-muted">{bn ? settings.addressBn : settings.addressEn}</p>
            <p className="text-xs text-muted">{settings.phone} · {settings.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{invoice.number}</p>
            <p className="text-xs text-muted">{formatDate(invoice.issuedAt, locale)}</p>
            <p className="text-xs text-muted">{invoice.order.orderNo}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{bn ? "বিলিং" : "Billed to"}</p>
            <p className="mt-1 font-medium">{invoice.order.receiverName}</p>
            <p className="text-xs text-muted">{invoice.order.phone}</p>
            <p className="text-xs text-muted">{invoice.order.address}, {invoice.order.city}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{bn ? "পেমেন্ট" : "Payment"}</p>
            <p className="mt-1 text-xs text-muted">{invoice.order.paymentStatus}</p>
          </div>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2">{bn ? "পণ্য" : "Item"}</th>
              <th className="py-2 text-center">{bn ? "পরিমাণ" : "Qty"}</th>
              <th className="py-2 text-right">{bn ? "মূল্য" : "Price"}</th>
              <th className="py-2 text-right">{bn ? "মোট" : "Total"}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.order.items.map((item) => (
              <tr key={item.id} className="border-b border-line">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatTaka(item.unitPrice, locale)}</td>
                <td className="py-2 text-right">{formatTaka(item.total, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{bn ? "সাবটোটাল" : "Subtotal"}</dt><dd>{formatTaka(invoice.subtotal, locale)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{bn ? "ডেলিভারি" : "Delivery"}</dt><dd>{formatTaka(invoice.deliveryFee, locale)}</dd></div>
          {invoice.discount > 0 ? <div className="flex justify-between"><dt className="text-muted">{bn ? "ডিসকাউন্ট" : "Discount"}</dt><dd>−{formatTaka(invoice.discount, locale)}</dd></div> : null}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>{bn ? "মোট" : "Total"}</dt><dd>{formatTaka(invoice.total, locale)}</dd></div>
        </dl>

        <p className="mt-6 border-t border-line pt-3 text-[0.65rem] text-muted">
          {bn ? "ধন্যবাদ! এটি একটি কম্পিউটার-জেনারেটেড ইনভয়েস।" : "Thank you. This is a computer-generated invoice."}
        </p>
      </div>
    </div>
  );
}
