import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Prose } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return { title: "Page" };
  return { title: pick<string>(page as never, "title", locale) };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();

  return (
    <div className="container-page max-w-3xl py-10">
      <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: pick<string>(page as never, "title", locale) }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{pick<string>(page as never, "title", locale)}</h1>
      <p className="mt-1 text-xs text-muted">
        {locale === "bn" ? "সর্বশেষ হালনাগাদ" : "Last updated"}: {page.updatedAt.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB")}
      </p>
      <div className="card mt-5 p-6">
        <Prose html={pick<string>(page as never, "content", locale)} />
      </div>
    </div>
  );
}
