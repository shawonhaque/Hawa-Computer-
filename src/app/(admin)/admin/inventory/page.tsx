import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { adjustStock } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireStaff(PERMISSIONS.INVENTORY_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [products, movements] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { stock: "asc" } }),
    prisma.stockMovement.findMany({ include: { product: { select: { nameEn: true } } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={d.admin.inventory} description={bn ? "স্টক এন্ট্রি, এক্সিট ও সমন্বয়।" : "Stock entries, exits and adjustments."} />
      {products.length === 0 ? (
        <EmptyState title={d.empty.title} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{bn ? "পণ্য" : "Product"}</th><th>{bn ? "স্টক" : "Stock"}</th><th>{bn ? "সমন্বয়" : "Adjust"}</th></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <p className="font-medium">{bn ? product.nameBn : product.nameEn}</p>
                    <p className="text-[0.7rem] text-muted">{product.sku}</p>
                  </td>
                  <td><Badge tone={product.stock <= product.lowStockAt ? "danger" : "success"}>{product.stock}</Badge></td>
                  <td>
                    <form action={adjustStock} className="flex flex-wrap items-center gap-1.5">
                      <input type="hidden" name="productId" value={product.id} />
                      <Select name="type" defaultValue="IN" className="h-8 w-24 text-xs">
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                        <option value="ADJUSTMENT">SET</option>
                      </Select>
                      <input name="quantity" type="number" min={1} defaultValue={1} className="input h-8 w-16 text-xs" />
                      <input name="reason" placeholder={bn ? "কারণ" : "Reason"} className="input h-8 w-28 text-xs" />
                      <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">{bn ? "সাম্প্রতিক স্টক মুভমেন্ট" : "Recent stock movements"}</h2>
        <ul className="space-y-2 text-sm">
          {movements.map((movement) => (
            <li key={movement.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
              <span className="text-muted">{movement.product.nameEn} · {movement.reason ?? movement.type}</span>
              <span className="flex items-center gap-2">
                <Badge tone={movement.type === "IN" ? "success" : movement.type === "OUT" ? "danger" : "warning"}>
                  {movement.type === "IN" ? "+" : movement.type === "OUT" ? "−" : "="}{movement.quantity}
                </Badge>
                <span className="text-[0.65rem] text-muted">{formatDateTime(movement.createdAt, locale)}</span>
              </span>
            </li>
          ))}
          {movements.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো মুভমেন্ট নেই।" : "No movements yet."}</li> : null}
        </ul>
      </section>
    </div>
  );
}
