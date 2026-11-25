import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, FileText, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { formatTaka } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ServiceOrderForm, type FieldDef } from "@/components/site/order-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return { title: "Service" };
  return {
    title: pick<string>(service as never, "name", locale),
    description: pick<string>(service as never, "summary", locale),
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();
  const settings = await getSettings();

  const service = await prisma.service.findUnique({ where: { slug }, include: { category: true } });
  if (!service || !service.active) notFound();

  if (service.kind === "APPLICATION") {
    return (
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.applications, href: "/applications" }, { label: pick<string>(service as never, "name", locale) }]} />
        <div className="card mx-auto max-w-2xl p-6 text-center">
          <h1 className="text-xl font-bold">{pick<string>(service as never, "name", locale)}</h1>
          <p className="mt-2 text-sm text-muted">{pick<string>(service as never, "summary", locale)}</p>
          <Link href={`/applications/${service.slug}`} className="btn btn-primary mt-5">
            {d.common.applyNow} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const requirements = (service.requirements as string[]) ?? [];
  const documents = (service.documents as string[]) ?? [];
  const fields = (service.formFields as unknown as FieldDef[]) ?? [];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-8">
          <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.services, href: "/services" }, { label: pick<string>(service as never, "name", locale) }]} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cyan">{pick<string>(service.category as never, "name", locale)}</Badge>
            {service.featured ? <Badge tone="info">{d.common.featured}</Badge> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{pick<string>(service as never, "name", locale)}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{pick<string>(service as never, "summary", locale)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-lg font-bold text-royal">{formatTaka(service.price, locale)}</span>
            <span className="flex items-center gap-1.5 text-muted">
              <Clock size={14} /> {pick<string>(service as never, "processingTime", locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-semibold">{bn ? "সেবার বিবরণ" : "Service details"}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {pick<string>(service as never, "description", locale)}
            </p>
          </section>

          {requirements.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-base font-semibold">{bn ? "শর্ত ও প্রয়োজনীয়তা" : "Requirements"}</h2>
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
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3 text-xs leading-relaxed text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-warning" />
            <p>{d.footer.disclaimer}</p>
          </div>
        </div>

        <aside className="card h-fit p-5">
          <h2 className="mb-4 text-base font-semibold">{bn ? "অর্ডার করুন" : "Place your order"}</h2>
          <ServiceOrderForm
            service={{
              id: service.id,
              slug: service.slug,
              price: service.price,
              nameBn: service.nameBn,
              nameEn: service.nameEn,
              kind: service.kind,
              requiresConsent: service.requiresConsent,
              formFields: fields,
              documents,
            }}
            locale={locale}
            loggedIn={Boolean(user)}
            labels={{
              quantity: d.common.quantity,
              total: d.common.total,
              instructions: bn ? "বিশেষ নির্দেশনা (ঐচ্ছিক)" : "Special instructions (optional)",
              pickup: bn ? "দোকান থেকে সংগ্রহ" : "Shop pickup",
              delivery: bn ? "হোম ডেলিভারি" : "Home delivery",
              address: d.shop.address,
              upload: bn ? "ফাইল আপলোড করুন" : "Upload files",
              uploadHint: bn ? "JPG, PNG, PDF — সর্বোচ্চ ১০MB" : "JPG, PNG, PDF — up to 10MB",
              consent: bn ? "আমি শর্তাবলীতে সম্মত এবং নিশ্চিত করছি যে প্রদত্ত তথ্য সঠিক।" : "I agree to the terms and confirm the information is accurate.",
              submit: bn ? "অর্ডার নিশ্চিত করুন" : "Confirm order",
              submitting: d.common.loading,
              loginToOrder: bn ? "অর্ডার করতে লগইন করুন" : "Log in to order",
              sizeGuide: bn ? "প্রয়োজন অনুযায়ী পরিমাণ দিন" : "Set the quantity you need",
            }}
          />
          <p className="mt-3 text-center text-[0.7rem] text-muted">
            {bn ? "পেমেন্ট অর্ডারের পর" : "Payment after order"} · {settings.phone}
          </p>
        </aside>
      </div>
    </>
  );
}
