import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { toggleProductActive } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireStaff(PERMISSIONS.PRODUCT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title={d.admin.products}
        description={bn ? "পণ্য যোগ, সম্পাদনা ও স্টক নিয়ন্ত্রণ।" : "Add, edit and control product stock."}
        actions={<ButtonLink href="/admin/products/new" size="sm">+ {d.common.create}</ButtonLink>}
      />
      {products.length === 0 ? (
        <EmptyState title={d.empty.title} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>SKU</th><th>{bn ? "পণ্য" : "Product"}</th><th>{d.shop.categories}</th><th>{d.common.price}</th><th>{bn ? "স্টক" : "Stock"}</th><th>{d.common.status}</th><th /></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-mono text-xs text-muted">{product.sku}</td>
                  <td className="font-medium">{bn ? product.nameBn : product.nameEn}</td>
                  <td className="text-muted">{bn ? product.category.nameBn : product.category.nameEn}</td>
                  <td className="font-semibold">{formatTaka(product.price, locale)}</td>
                  <td><Badge tone={product.stock <= product.lowStockAt ? "danger" : "success"}>{product.stock}</Badge></td>
                  <td>{product.active ? <Badge tone="success">ACTIVE</Badge> : <Badge tone="neutral">HIDDEN</Badge>}</td>
                  <td className="flex justify-end gap-2">
                    <Link href={`/admin/products/${product.id}`} className="text-xs font-semibold text-royal">{d.common.edit}</Link>
                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={product.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="…">{product.active ? (bn ? "লুকান" : "Hide") : bn ? "দেখান" : "Show"}</SubmitButton>
                    </form>
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
