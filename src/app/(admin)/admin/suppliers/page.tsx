import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { createPurchase, saveSupplier } from "@/actions/admin-commerce";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  await requireStaff(PERMISSIONS.SUPPLIER_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [suppliers, products, purchases] = await Promise.all([
    prisma.supplier.findMany({ include: { purchases: { take: 1, orderBy: { purchasedAt: "desc" } } }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, select: { id: true, nameEn: true, sku: true }, orderBy: { nameEn: "asc" } }),
    prisma.purchase.findMany({ include: { supplier: true, items: true }, orderBy: { purchasedAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={d.admin.suppliers} description={bn ? "সরবরাহকারী ও ক্রয় রেকর্ড।" : "Suppliers and purchase records."} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">{bn ? "সরবরাহকারী তালিকা" : "Supplier list"}</h2>
          <div className="space-y-2">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-line p-3 text-sm">
                <p className="font-medium">{supplier.name}</p>
                <p className="text-xs text-muted">{supplier.contactName ?? "—"} · {supplier.phone ?? "—"}</p>
                <p className="text-xs text-muted">{supplier.address ?? ""}</p>
                <p className="mt-1 text-[0.65rem] text-muted">
                  {bn ? "সর্বশেষ ক্রয়" : "Last purchase"}: {supplier.purchases[0] ? formatDate(supplier.purchases[0].purchasedAt, locale) : "—"}
                </p>
              </div>
            ))}
            {suppliers.length === 0 ? <p className="text-xs text-muted">{bn ? "কোনো সরবরাহকারী নেই।" : "No suppliers yet."}</p> : null}
          </div>

          <form action={saveSupplier} className="mt-4 space-y-2 border-t border-line pt-3">
            <h3 className="text-sm font-semibold">{bn ? "নতুন সরবরাহকারী" : "Add supplier"}</h3>
            <Input name="name" placeholder={bn ? "নাম" : "Name"} required />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input name="contactName" placeholder={bn ? "যোগাযোগ ব্যক্তি" : "Contact person"} />
              <Input name="phone" placeholder={bn ? "ফোন" : "Phone"} />
            </div>
            <Input name="address" placeholder={bn ? "ঠিকানা" : "Address"} />
            <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
          </form>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">{bn ? "নতুন ক্রয় (স্টক যোগ)" : "New purchase (stock in)"}</h2>
          <form action={createPurchase} className="space-y-3">
            <div>
              <Label htmlFor="supplierId" required>{d.admin.suppliers}</Label>
              <Select id="supplierId" name="supplierId" required>
                <option value="" disabled>—</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="productId" required>{bn ? "পণ্য" : "Product"}</Label>
              <Select id="productId" name="productId" required>
                <option value="" disabled>—</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.nameEn} ({product.sku})</option>)}
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity" required>{d.common.quantity}</Label>
                <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              </div>
              <div>
                <Label htmlFor="unitCost" required>{bn ? "একক ক্রয়মূল্য" : "Unit cost"}</Label>
                <Input id="unitCost" name="unitCost" type="number" min={1} required />
              </div>
            </div>
            <Textarea name="note" rows={2} placeholder={bn ? "নোট" : "Note"} />
            <SubmitButton size="sm" pendingLabel="…">{bn ? "ক্রয় রেকর্ড করুন" : "Record purchase"}</SubmitButton>
          </form>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">{bn ? "ক্রয় ইতিহাস" : "Purchase history"}</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Ref</th><th>{d.admin.suppliers}</th><th>{bn ? "আইটেম" : "Items"}</th><th>{d.common.total}</th><th>{d.common.date}</th></tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="font-medium">{purchase.refNo}</td>
                  <td className="text-muted">{purchase.supplier.name}</td>
                  <td className="text-muted">{purchase.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="font-semibold">{formatTaka(purchase.total, locale)}</td>
                  <td className="text-muted">{formatDate(purchase.purchasedAt, locale)}</td>
                </tr>
              ))}
              {purchases.length === 0 ? <tr><td colSpan={5} className="text-center text-xs text-muted">{bn ? "কোনো ক্রয় নেই।" : "No purchases yet."}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
