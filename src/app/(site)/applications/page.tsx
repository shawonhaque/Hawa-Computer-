import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { Icon } from "@/components/ui/icon";
import { DocChecklist } from "@/components/site/doc-checklist";
import { EmptyState } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "অনলাইন আবেদন সেবা" : "Online Application Services",
    description:
      locale === "bn"
        ? "পাসপোর্ট, এনআইডি, জন্ম নিবন্ধন, ভর্তি ও চাকরির আবেদনে পেশাদার সহায়তা।"
        : "Professional help with passport, NID, birth registration, admission and job applications.",
  };
}

export default async function ApplicationsPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const services = await prisma.service.findMany({
    where: { active: true, kind: "APPLICATION" },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const grouped = services.reduce<Record<string, typeof services>>((acc, service) => {
    const key = service.categoryId;
    acc[key] = acc[key] ? [...acc[key], service] : [service];
    return acc;
  }, {});

  return (
    <>
      <PageHero
        eyebrow={bn ? "আবেদন" : "Applications"}
        title={bn ? "অনলাইন আবেদনে পেশাদার সহায়তা" : "Professional help with online applications"}
        description={
          bn
            ? "পাসপোর্ট, এনআইডি, জন্ম নিবন্ধন, শিক্ষা প্রতিষ্ঠান ও চাকরির আবেদন — ফরম পূরণ থেকে জমা দেওয়া পর্যন্ত।"
            : "Passport, NID, birth registration, education and job applications — from form filling to submission."
        }
      />

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.applications }]} />

        <div className="mb-8 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3.5 text-xs leading-relaxed text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-warning" />
          <p>{d.footer.disclaimer}</p>
        </div>

        {services.length === 0 ? (
          <EmptyState title={d.empty.title} body={d.empty.body} />
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([categoryId, items]) => (
              <section key={categoryId}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal-soft text-royal">
                    <Icon name={items[0].category.icon} size={16} />
                  </span>
                  {pick<string>(items[0].category as never, "name", locale)}
                </h2>
                <div data-reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((service) => (
                    <div key={service.id} className="card card-hover group flex h-full flex-col p-4">
                      <Link href={`/applications/${service.slug}`} className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-royal/12 to-cyan/10 text-royal">
                          <Icon name={service.icon ?? "FileText"} size={17} />
                        </span>
                        <span className="text-sm font-bold text-royal">{formatTaka(service.price, locale)}</span>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold leading-snug group-hover:text-royal">
                        {pick<string>(service as never, "name", locale)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {pick<string>(service as never, "summary", locale)}
                      </p>
                        <div className="mt-auto flex items-center justify-between pt-3 text-[0.7rem] text-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {pick<string>(service as never, "processingTime", locale)}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-royal">
                            {d.common.applyNow} <ArrowRight size={12} />
                          </span>
                        </div>
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                        <DocChecklist
                          title={pick<string>(service as never, "name", locale)}
                          documents={(service.documents as string[]) ?? []}
                          label={bn ? "কী কী কাগজ লাগবে?" : "Documents needed?"}
                          heading={bn ? "প্রয়োজনীয় কাগজপত্র" : "Required documents"}
                          note={
                            bn
                              ? "কাগজপত্রের ছবি বা স্ক্যান আমাদের কাছে নিয়ে আসুন বা হোয়াটসঅ্যাপে পাঠান। মূল কপি সঙ্গে রাখলে ভালো।"
                              : "Bring or WhatsApp us photos/scans of these documents. Originals help us verify details faster."
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
