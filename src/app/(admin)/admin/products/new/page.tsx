import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/primitives";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireStaff(PERMISSIONS.PRODUCT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const categories = await prisma.productCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <PageHeader title={bn ? "নতুন পণ্য" : "New product"} />
      <div className="card p-5">
        <ProductForm
          categories={categories}
          labels={{
            save: d.common.save,
            name: bn ? "নাম" : "Name",
            category: d.shop.categories,
            price: d.common.price,
            stock: bn ? "স্টক" : "Stock",
            description: bn ? "বিবরণ" : "Description",
            active: bn ? "সক্রিয়" : "Active",
            featured: d.common.featured,
            brand: bn ? "ব্র্যান্ড" : "Brand",
            sku: "SKU",
            slug: "Slug",
          }}
        />
      </div>
    </div>
  );
}
