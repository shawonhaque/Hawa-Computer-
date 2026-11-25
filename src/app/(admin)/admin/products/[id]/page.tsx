import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/primitives";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(PERMISSIONS.PRODUCT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title={bn ? "পণ্য সম্পাদনা" : "Edit product"} description={product.sku} />
      <div className="card p-5">
        <ProductForm
          product={product}
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
