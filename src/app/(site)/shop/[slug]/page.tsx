import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Package, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { formatTaka } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/primitives";
import { AddToCart } from "@/components/ui/add-to-cart";
import { ProductCard } from "@/components/site/cards";
import { toggleWishlist, submitReview } from "@/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product" };
  return { title: pick<string>(product as never, "name", locale), description: pick<string>(product as never, "description", locale).slice(0, 160) };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: { where: { approved: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product || !product.active) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, active: true },
    take: 4,
  });

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const name = pick<string>(product as never, "name", locale);
  const averageRating = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 0;
  const wished = user
    ? Boolean(await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }))
    : false;

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: d.nav.home, href: "/" },
          { label: d.nav.shop, href: "/shop" },
          { label: pick<string>(product.category as never, "name", locale), href: `/shop?category=${product.category.slug}` },
          { label: name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
          <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-royal/10 via-transparent to-cyan/10">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <Package size={72} className="text-royal/40" />
            )}
          </div>
        </div>

        <div>
          <Badge tone="cyan">{pick<string>(product.category as never, "name", locale)}</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
          {product.brand ? <p className="mt-1 text-sm text-muted">{product.brand} · SKU {product.sku}</p> : null}

          <div className="mt-3 flex items-center gap-2">
            <Rating value={averageRating} />
            <span className="text-xs text-muted">({product.reviews.length})</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-royal">{formatTaka(product.price, locale)}</span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-base text-muted line-through">{formatTaka(product.comparePrice, locale)}</span>
            ) : null}
          </div>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <Badge tone={product.stock <= product.lowStockAt ? "warning" : "success"}>
                {product.stock <= product.lowStockAt ? `${d.shop.lowStock}: ${product.stock}` : `${d.shop.inStock}: ${product.stock}`}
              </Badge>
            ) : (
              <Badge tone="danger">{d.shop.outOfStock}</Badge>
            )}
          </p>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
            {pick<string>(product as never, "description", locale)}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AddToCart
              product={{ productId: product.id, slug: product.slug, name, price: product.price, image: images[0] ?? null, stock: product.stock, sku: product.sku }}
              label={d.common.addToCart}
              addedLabel={bn ? "যোগ হয়েছে" : "Added"}
              outOfStockLabel={d.shop.outOfStock}
              size="md"
            />
            <Link href="/cart" className="btn btn-secondary">{d.common.cart}</Link>
            {user ? (
              <form action={toggleWishlist}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="returnTo" value={`/shop/${product.slug}`} />
                <button type="submit" className="btn btn-ghost btn-icon" aria-label={d.shop.wishlist} title={d.shop.wishlist}>
                  <Heart size={17} className={wished ? "fill-danger text-danger" : ""} />
                </button>
              </form>
            ) : null}
          </div>

          <ul className="mt-6 grid gap-2 border-t border-line pt-4 text-xs text-muted sm:grid-cols-2">
            <li className="flex items-center gap-2"><Truck size={14} /> {bn ? "শহরে ৬০৳, বাইরে ১২০৳ ডেলিভারি" : "Delivery 60৳ inside city, 120৳ outside"}</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14} /> {bn ? "নিরাপদ প্যাকেজিং" : "Safe packaging"}</li>
          </ul>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">{d.shop.reviews}</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {product.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
                {bn ? "এখনো কোনো রিভিউ নেই।" : "No reviews yet."}
              </p>
            ) : (
              product.reviews.map((review) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{review.user.name}</p>
                    <Rating value={review.rating} />
                  </div>
                  {review.comment ? <p className="mt-2 text-sm text-muted">{review.comment}</p> : null}
                </div>
              ))
            )}
          </div>

          {user ? (
            <form action={submitReview} className="card h-fit space-y-3 p-4">
              <h3 className="text-sm font-semibold">{d.shop.writeReview}</h3>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="slug" value={product.slug} />
              <div>
                <label htmlFor="rating" className="label">{bn ? "রেটিং" : "Rating"}</label>
                <select id="rating" name="rating" className="select" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} ★</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="comment" className="label">{bn ? "মন্তব্য" : "Comment"}</label>
                <textarea id="comment" name="comment" rows={3} className="textarea" />
              </div>
              <SubmitButton className="w-full" pendingLabel={d.common.loading}>{d.common.submit}</SubmitButton>
              <p className="text-[0.7rem] text-muted">{bn ? "রিভিউ অনুমোদনের পর দেখা যাবে।" : "Reviews appear after moderation."}</p>
            </form>
          ) : (
            <div className="card h-fit p-4 text-sm text-muted">
              <Link href={`/login?next=/shop/${product.slug}`} className="font-semibold text-royal">{d.common.login}</Link>{" "}
              {bn ? "করে রিভিউ লিখুন।" : "to write a review."}
            </div>
          )}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">{d.shop.relatedProducts}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item as never}
                locale={locale}
                addLabel={d.common.addToCart}
                addedLabel={bn ? "যোগ হয়েছে" : "Added"}
                outOfStock={d.shop.outOfStock}
                inStockLabel={d.shop.inStock}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
