import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { EmptyState } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const [services, products, books, courses] = term
    ? await Promise.all([
        prisma.service.findMany({
          where: {
            active: true,
            OR: [
              { nameBn: { contains: term, mode: "insensitive" } },
              { nameEn: { contains: term, mode: "insensitive" } },
              { summaryBn: { contains: term, mode: "insensitive" } },
              { summaryEn: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 8,
        }),
        prisma.product.findMany({
          where: {
            active: true,
            OR: [
              { nameBn: { contains: term, mode: "insensitive" } },
              { nameEn: { contains: term, mode: "insensitive" } },
              { brand: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 8,
        }),
        prisma.book.findMany({
          where: {
            OR: [
              { titleBn: { contains: term, mode: "insensitive" } },
              { titleEn: { contains: term, mode: "insensitive" } },
              { author: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 6,
        }),
        prisma.course.findMany({
          where: {
            active: true,
            OR: [
              { titleBn: { contains: term, mode: "insensitive" } },
              { titleEn: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 4,
        }),
      ])
    : [[], [], [], []];

  const total = services.length + products.length + books.length + courses.length;

  return (
    <>
      <PageHero eyebrow={bn ? "সার্চ" : "Search"} title={term ? `“${term}”` : d.common.search}>
        <form action="/search" method="get" className="mt-6 flex max-w-lg gap-2" role="search">
          <input name="q" defaultValue={term} placeholder={d.common.searchPlaceholder} className="input" aria-label={d.common.search} />
          <button type="submit" className="btn btn-primary btn-sm">{d.common.search}</button>
        </form>
      </PageHero>

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.common.search }]} />

        {!term ? (
          <EmptyState title={bn ? "কিছু লিখে খুঁজুন" : "Type something to search"} body={d.common.searchPlaceholder} />
        ) : total === 0 ? (
          <EmptyState title={d.common.noResults} body={bn ? "অন্য শব্দ দিয়ে চেষ্টা করুন।" : "Try a different keyword."} />
        ) : (
          <div className="space-y-8">
            {services.length > 0 ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{d.nav.services}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <Link key={service.id} href={service.kind === "APPLICATION" ? `/applications/${service.slug}` : `/services/${service.slug}`} className="card card-hover flex items-start gap-3 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-soft text-royal">
                        <Icon name={service.icon ?? "Sparkles"} size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{pick<string>(service as never, "name", locale)}</p>
                        <p className="text-xs text-muted">{formatTaka(service.price, locale)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {products.length > 0 ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{d.nav.shop}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((product) => (
                    <Link key={product.id} href={`/shop/${product.slug}`} className="card card-hover p-4">
                      <p className="text-sm font-semibold">{pick<string>(product as never, "name", locale)}</p>
                      <p className="mt-1 text-xs text-muted">{formatTaka(product.price, locale)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {books.length > 0 ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{d.nav.library}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => (
                    <Link key={book.id} href={`/library/${book.slug}`} className="card card-hover p-4">
                      <p className="text-sm font-semibold">{pick<string>(book as never, "title", locale)}</p>
                      <p className="mt-1 text-xs text-muted">{book.author}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {courses.length > 0 ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{d.nav.training}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Link key={course.id} href={`/training/${course.slug}`} className="card card-hover p-4">
                      <p className="text-sm font-semibold">{pick<string>(course as never, "title", locale)}</p>
                      <p className="mt-1 text-xs text-muted">{formatTaka(course.fee, locale)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
