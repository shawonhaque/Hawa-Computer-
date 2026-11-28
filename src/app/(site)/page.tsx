import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { getSettings } from "@/lib/settings";
import { CourseCard, ProductCard, ServiceCard, TestimonialCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const settings = await getSettings();
  const bn = locale === "bn";
  const name = bn ? settings.businessNameBn : settings.businessNameEn;
  return {
    title: `${name} — ${bn ? settings.taglineBn : settings.taglineEn}`,
    description: bn
      ? "কম্পিউটার সেবা, অনলাইন আবেদন, পাসপোর্ট সহায়তা, ফটো স্টুডিও, স্টেশনারি, বই ও কম্পিউটার প্রশিক্ষণ — এক ছাদের নিচে।"
      : "Computer services, online applications, passport assistance, photo studio, stationery, books and computer training — all under one roof.",
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const settings = await getSettings();

  const [featured, applications, studio, products, courses, testimonials, faqs, serviceCount, productCount] =
    await Promise.all([
      prisma.service.findMany({
        where: { active: true, featured: true },
        include: { category: { select: { icon: true } } },
        orderBy: { sortOrder: "asc" },
        take: 6,
      }),
      prisma.service.findMany({
        where: { active: true, kind: "APPLICATION" },
        include: { category: { select: { icon: true } } },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 4,
      }),
      prisma.service.findMany({
        where: { active: true, kind: { in: ["PHOTO", "DOCUMENT", "PRINTING"] } },
        include: { category: { select: { icon: true } } },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 4,
      }),
      prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.course.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 3 }),
      prisma.testimonial.findMany({
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
      prisma.service.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
    ]);

  const popular = (featured.length > 0 ? featured : applications).map((service) => ({
    ...service,
    icon: service.icon ?? service.category.icon,
  }));

  const serviceLabels = {
    locale,
    orderLabel: d.common.orderNow,
    fromLabel: bn ? "শুরু" : "From",
    featuredLabel: d.common.featured,
  };

  const stats = [
    { value: `${serviceCount}`, label: bn ? "সেবা ও আবেদন" : "Services & applications" },
    { value: `${productCount}`, label: bn ? "স্টকে পণ্য" : "Products in stock" },
    { value: `${courses.length}`, label: bn ? "চলমান কোর্স" : "Ongoing courses" },
    { value: bn ? "৯টা–৯টা" : "9am–9pm", label: bn ? "খোলা থাকার সময়" : "Opening hours" },
  ];

  const steps = [
    { title: d.home.step1Title, body: d.home.step1Body },
    { title: d.home.step2Title, body: d.home.step2Body },
    { title: d.home.step3Title, body: d.home.step3Body },
    { title: d.home.step4Title, body: d.home.step4Body },
  ];

  const why = [
    { icon: Wallet, title: d.home.why1, body: d.home.why1Body },
    { icon: ShieldCheck, title: d.home.why2, body: d.home.why2Body },
    { icon: Users, title: d.home.why3, body: d.home.why3Body },
    { icon: MessageCircle, title: d.home.why4, body: d.home.why4Body },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-navy text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.35),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.28),transparent_40%)]"
        />
        <div className="container-page relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan backdrop-blur">
              <Sparkles size={13} /> {bn ? settings.taglineBn : settings.taglineEn}
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              {d.home.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {d.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/services" className="btn btn-primary">
                {d.home.heroCtaPrimary} <ArrowRight size={16} />
              </Link>
              <Link
                href="/shop"
                className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                {d.home.heroCtaSecondary}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
              {[d.home.trust1, d.home.trust2, d.home.trust3].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-cyan" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="border-b border-line bg-surface">
        <div className="container-page grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center sm:px-6">
              <p className="text-xl font-bold text-royal sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="container-page py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/tools/photo", icon: "📸", bn: "ফটো এডিটর", en: "Photo editor", noteBn: "পাসপোর্ট সাইজ, এক ক্লিকে", noteEn: "Passport size in one click" },
            { href: "/services/bangla-typing", icon: "⌨️", bn: "টাইপিং", en: "Typing", noteBn: "বাংলা ও ইংরেজি", noteEn: "Bangla and English" },
            { href: "/applications", icon: "📝", bn: "অনলাইন আবেদন", en: "Applications", noteBn: "পাসপোর্ট, এনআইডি, ভর্তি", noteEn: "Passport, NID, admission" },
            { href: "/services/printing-photocopy", icon: "🖨️", bn: "প্রিন্ট", en: "Print", noteBn: "প্রিন্ট, ফটোকপি, স্ক্যান", noteEn: "Print, copy, scan" },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="card flex items-center gap-3 p-4 transition hover:border-royal hover:shadow-md"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-royal-soft text-lg">{tool.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{bn ? tool.bn : tool.en}</span>
                <span className="block truncate text-[0.72rem] text-muted">{bn ? tool.noteBn : tool.noteEn}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading
          eyebrow={bn ? "সেবা" : "Services"}
          title={d.home.popularServices}
          subtitle={d.home.popularServicesSub}
          action={
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
            >
              {d.common.viewAll} <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((service) => (
            <ServiceCard key={service.id} service={service} {...serviceLabels} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow={bn ? "আবেদন" : "Applications"}
            title={d.home.applications}
            subtitle={d.home.applicationsSub}
            action={
              <Link
                href="/applications"
                className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
              >
                {d.common.viewAll} <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {applications.map((service) => (
              <ServiceCard
                key={service.id}
                service={{ ...service, icon: service.icon ?? service.category.icon }}
                {...serviceLabels}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading
          eyebrow={bn ? "স্টুডিও ও ডকুমেন্ট" : "Studio & documents"}
          title={d.home.photoStudio}
          subtitle={d.home.photoStudioSub}
          action={
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
            >
              {d.common.viewAll} <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studio.map((service) => (
            <ServiceCard
              key={service.id}
              service={{ ...service, icon: service.icon ?? service.category.icon }}
              {...serviceLabels}
            />
          ))}
        </div>
      </section>

      {products.length > 0 ? (
        <section className="border-y border-line bg-surface py-12 sm:py-16">
          <div className="container-page">
            <SectionHeading
              eyebrow={bn ? "শপ" : "Shop"}
              title={d.home.latestProducts}
              subtitle={d.home.shopSub}
              action={
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
                >
                  {d.common.viewAll} <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  addLabel={d.common.addToCart}
                  addedLabel={bn ? "যোগ হয়েছে" : "Added"}
                  outOfStock={bn ? "স্টকে নেই" : "Out of stock"}
                  inStockLabel={bn ? "স্টকে" : "In stock"}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {courses.length > 0 ? (
        <section className="container-page py-12 sm:py-16">
          <SectionHeading
            eyebrow={bn ? "প্রশিক্ষণ" : "Training"}
            title={d.home.latestCourses}
            subtitle={d.home.trainingSub}
            action={
              <Link
                href="/training"
                className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
              >
                {d.common.viewAll} <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                locale={locale}
                enrollLabel={bn ? "ভর্তি হন" : "Enrol"}
                weeksLabel={bn ? "সপ্তাহ" : "weeks"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-line bg-navy py-12 text-white sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow={bn ? "প্রক্রিয়া" : "Process"}
            title={d.home.howItWorks}
            subtitle={d.home.howItWorksSub}
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-white/12 bg-white/5 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan/15 text-sm font-bold text-cyan">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/65">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading
          eyebrow={bn ? "কেন আমরা" : "Why us"}
          title={d.home.whyUs}
          subtitle={bn ? "যে কারণে গ্রাহকেরা আমাদের উপর ভরসা করেন" : "The reasons customers keep coming back"}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((item) => (
            <div key={item.title} className="card p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-royal/12 to-cyan/10 text-royal">
                <item.icon size={20} />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="border-y border-line bg-surface py-12 sm:py-16">
          <div className="container-page">
            <SectionHeading
              eyebrow={bn ? "মতামত" : "Reviews"}
              title={d.home.reviews}
              subtitle={bn ? "গ্রাহকেরা যা বলেছেন" : "What our customers say"}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="container-page pb-12 sm:pb-16">
          <SectionHeading
            eyebrow={bn ? "প্রশ্নোত্তর" : "FAQ"}
            title={d.home.faq}
            subtitle={bn ? "গ্রাহকেরা সবচেয়ে বেশি যা জানতে চান" : "What customers ask us most"}
            action={
              <Link
                href="/faq"
                className="inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline"
              >
                {d.common.viewAll} <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="card group p-4 open:pb-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold marker:content-none">
                  {bn ? faq.questionBn : faq.questionEn}
                  <span className="text-royal transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {bn ? faq.answerBn : faq.answerEn}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page py-12 sm:py-16">
        <div className="card flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{d.home.contactTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d.home.contactSub}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-1.5">
                <Clock size={14} /> {bn ? "শনি–বৃহস্পতি, ৯টা–৯টা" : "Sat–Thu, 9am–9pm"}
              </li>
              <li className="flex items-center gap-1.5">
                <Package size={14} /> {bn ? "ঘরে ডেলিভারি সুবিধা" : "Home delivery available"}
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${settings.phone}`} className="btn btn-primary">
              {settings.phone}
            </a>
            <Link href="/contact" className="btn btn-secondary">
              {d.nav.contact} <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {settings.mapEmbedUrl ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="card p-6">
              <h3 className="text-sm font-semibold">{bn ? "আমাদের ঠিকানা" : "Visit our shop"}</h3>
              <p className="mt-2 text-sm text-muted">{bn ? settings.addressBn : settings.addressEn}</p>
              <p className="mt-1 text-sm text-muted">{bn ? settings.hoursBn : settings.hoursEn}</p>
              <a href={`tel:${settings.phone}`} className="mt-3 inline-block text-sm font-semibold text-royal">
                {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`} className="mt-1 block text-sm text-royal">
                {settings.email}
              </a>
            </div>
            <div className="card overflow-hidden">
              <iframe
                src={settings.mapEmbedUrl}
                title={bn ? "ম্যাপে আমাদের অবস্থান" : "Our location on the map"}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0 lg:h-full"
              />
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
