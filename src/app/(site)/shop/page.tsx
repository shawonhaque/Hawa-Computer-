import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { ProductCard } from "@/components/site/cards";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "স্টেশনারি ও বই শপ" : "Stationery & Book Shop",
    description:
      locale === "bn"
        ? "খাতা, কলম, স্কুল সরবরাহ, অফিস সরবরাহ ও বই — ঘরে ডেলিভারি।"
        : "Notebooks, pens, school and office supplies and books — delivered to your door.",
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { category, q, sort } = await searchParams;

  const [categories, products] = await Promise.all([
    prisma.productCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { nameBn: { contains: q, mode: "insensitive" } },
                { nameEn: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHero
        eyebrow={bn ? "শপ" : "Shop"}
        title={bn ? "স্টেশনারি ও বই" : "Stationery & books"}
        description={
          bn
            ? "দৈনন্দিন অফিস ও স্কুল সরবরাহ, বই এবং লাইব্রেরি সেবা — অনলাইনে অর্ডার করুন।"
            : "Everyday office and school supplies, books and library service — order online."
        }
      >
        <form action="/shop" method="get" className="mt-6 flex max-w-lg gap-2" role="search">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q ?? ""} placeholder={d.common.searchPlaceholder} className="input pl-9" aria-label={d.common.search} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{d.common.search}</button>
        </form>
      </PageHero>

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.shop }]} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className={cn("badge", !category ? "badge-info" : "badge-neutral")}>{d.common.all}</Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/shop?category=${item.slug}`}
                className={cn("badge", category === item.slug ? "badge-info" : "badge-neutral")}
              >
                {pick<string>(item as never, "name", locale)}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 text-xs">
            {[
              { value: "", label: bn ? "নতুন" : "Newest" },
              { value: "price_asc", label: bn ? "কম দাম" : "Price ↑" },
              { value: "price_desc", label: bn ? "বেশি দাম" : "Price ↓" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`/shop?${new URLSearchParams({ ...(category ? { category } : {}), ...(q ? { q } : {}), ...(option.value ? { sort: option.value } : {}) }).toString()}`}
                className={cn("rounded-lg border px-2.5 py-1 font-medium", sort === option.value || (!sort && !option.value) ? "border-royal text-royal" : "border-line text-muted")}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState title={d.common.noResults} body={d.empty.body} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as never}
                locale={locale}
                addLabel={d.common.addToCart}
                addedLabel={bn ? "যোগ হয়েছে" : "Added"}
                outOfStock={d.shop.outOfStock}
                inStockLabel={d.shop.inStock}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
