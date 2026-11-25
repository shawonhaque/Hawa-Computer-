import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, Info, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { formatTaka } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ApplicationForm, type FieldDef } from "@/components/site/order-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return { title: "Application" };
  return {
    title: pick<string>(service as never, "name", locale),
    description: pick<string>(service as never, "summary", locale),
  };
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();

  const service = await prisma.service.findUnique({ where: { slug }, include: { category: true } });
  if (!service || !service.active || service.kind !== "APPLICATION") notFound();

  const fields = (service.formFields as unknown as FieldDef[]) ?? [];
  const requirements = (service.requirements as string[]) ?? [];
  const documents = (service.documents as string[]) ?? [];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { label: d.nav.home, href: "/" },
              { label: d.nav.applications, href: "/applications" },
              { label: pick<string>(service as never, "name", locale) },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cyan">{pick<string>(service.category as never, "name", locale)}</Badge>
            <Badge tone="neutral">{bn ? "আবেদন সহায়তা" : "Application assistance"}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {pick<string>(service as never, "name", locale)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {pick<string>(service as never, "summary", locale)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-lg font-bold text-royal">{formatTaka(service.price, locale)}</span>
            <span className="flex items-center gap-1.5 text-muted">
              <Clock size={14} /> {pick<string>(service as never, "processingTime", locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-semibold">{bn ? "এই সেবায় কী করা হয়" : "What this service covers"}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {pick<string>(service as never, "description", locale)}
            </p>
          </section>

          {requirements.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold">{bn ? "শর্ত ও যোগ্যতা" : "Requirements"}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {documents.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold">{bn ? "প্রয়োজনীয় কাগজপত্র" : "Required documents"}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {documents.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <FileText size={15} className="mt-0.5 shrink-0 text-royal" /> {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.7rem] text-muted">
                {bn
                  ? "ডকুমেন্ট প্রাইভেট স্টোরেজে সংরক্ষিত হয়; শুধু অনুমোদিত কর্মী দেখতে পারেন।"
                  : "Documents are stored privately and only authorised staff can view them."}
              </p>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3.5 text-xs leading-relaxed text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-warning" />
            <p>{d.footer.disclaimer}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-royal/20 bg-royal/5 p-3.5 text-xs leading-relaxed text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-royal" />
            <p>
              {bn
                ? "আমরা সরকারি পোর্টালের পাসওয়ার্ড বা ওটিপি সংরক্ষণ করি না। প্রয়োজনে সরকারি পোর্টালে সরাসরি লগইন করে কাজ করা হয়।"
                : "We never store government portal passwords or OTPs. Where required, the official portal is used directly."}
            </p>
          </div>
        </div>

        <aside className="card h-fit p-5">
          <h2 className="mb-4 text-base font-semibold">{bn ? "আবেদন ফরম" : "Application form"}</h2>
          <ApplicationForm
            service={{
              id: service.id,
              slug: service.slug,
              nameBn: service.nameBn,
              nameEn: service.nameEn,
              price: service.price,
              formFields: fields,
              documents,
              requiresConsent: service.requiresConsent,
            }}
            locale={locale}
            loggedIn={Boolean(user)}
            labels={{
              documents: bn ? "কাগজপত্র আপলোড" : "Upload documents",
              uploadDoc: d.common.upload,
              note: bn ? "অতিরিক্ত তথ্য বা নির্দেশনা" : "Additional information or instructions",
              consent: bn
                ? "আমি নিশ্চিত করছি যে প্রদত্ত তথ্য সঠিক এবং আমি জানি এটি একটি স্বাধীন সহায়তা সেবা, সরকারি সেবা নয়।"
                : "I confirm the information is accurate and understand this is an independent assistance service, not a government service.",
              submit: bn ? "আবেদন জমা দিন" : "Submit application",
              submitting: d.common.loading,
              loginToApply: bn ? "আবেদন করতে লগইন করুন" : "Log in to apply",
            }}
          />
        </aside>
      </div>
    </>
  );
}
