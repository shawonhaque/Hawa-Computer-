import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { ServiceCard } from "@/components/site/cards";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "সকল সেবা" : "All Services",
    description:
      locale === "bn"
        ? "কম্পিউটার, আবেদন, ফটো, ডকুমেন্ট, প্রিন্ট ও অন্যান্য সেবার সম্পূর্ণ তালিকা।"
        : "The full list of computer, application, photo, document and printing services.",
  };
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { category, q } = await searchParams;

  const [categories, services] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({
      where: {
        active: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { nameBn: { contains: q, mode: "insensitive" } },
                { nameEn: { contains: q, mode: "insensitive" } },
                { summaryBn: { contains: q, mode: "insensitive" } },
                { summaryEn: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHero
        eyebrow={bn ? "সেবা" : "Services"}
        title={bn ? "আপনার প্রয়োজনীয় সব সেবা" : "Every service you need"}
        description={
          bn
            ? "কম্পিউটার সেবা, অনলাইন আবেদন, ফটো স্টুডিও, ডকুমেন্ট প্রস্তুতি ও প্রিন্টিং — স্বচ্ছ মূল্যে।"
            : "Computer services, online applications, photo studio, document preparation and printing — at transparent prices."
        }
      >
        <form action="/services" method="get" className="mt-6 flex max-w-lg gap-2" role="search">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q ?? ""} placeholder={d.common.searchPlaceholder} className="input pl-9" aria-label={d.common.search} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{d.common.search}</button>
        </form>
      </PageHero>

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.services }]} />

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/services" className={cn("badge", !category ? "badge-info" : "badge-neutral")}>
            {d.common.all}
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/services?category=${item.slug}`}
              className={cn("badge", category === item.slug ? "badge-info" : "badge-neutral")}
            >
              {pick<string>(item as never, "name", locale)}
            </Link>
          ))}
        </div>

        {services.length === 0 ? (
          <EmptyState title={d.common.noResults} body={d.empty.body} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={{ ...service, icon: service.icon ?? service.category.icon }}
                locale={locale}
                orderLabel={d.common.orderNow}
                fromLabel={d.common.from}
                featuredLabel={d.common.featured}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
