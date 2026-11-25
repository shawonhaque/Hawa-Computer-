import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { EmptyState } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "bn" ? "প্রশ্নোত্তর" : "FAQ" };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const faqs = await prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHero
        eyebrow={bn ? "প্রশ্নোত্তর" : "FAQ"}
        title={bn ? "সাধারণ প্রশ্নোত্তর" : "Frequently asked questions"}
        description={bn ? "সেবা, পেমেন্ট, ডকুমেন্ট ও রিফান্ড সংক্রান্ত সাধারণ প্রশ্নের উত্তর।" : "Answers about services, payments, documents and refunds."}
      />
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.faq }]} />

        {faqs.length === 0 ? (
          <EmptyState title={d.empty.title} body={d.empty.body} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-2.5">
            {faqs.map((faq) => (
              <details key={faq.id} className="group card p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {pick<string>(faq as never, "question", locale)}
                  <ChevronRight size={16} className="shrink-0 text-muted transition group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{pick<string>(faq as never, "answer", locale)}</p>
              </details>
            ))}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-line bg-surface p-5 text-center">
          <p className="text-sm font-semibold">{bn ? "উত্তর পাননি?" : "Didn't find your answer?"}</p>
          <Link href="/contact" className="btn btn-primary btn-sm mt-3">{d.nav.contact}</Link>
        </div>
      </div>
    </>
  );
}
