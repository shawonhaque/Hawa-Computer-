import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { Prose } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "আমাদের সম্পর্কে" : "About Us",
    description:
      locale === "bn"
        ? "হাওয়া কম্পিউটার — স্থানীয় পর্যায়ে নির্ভরযোগ্য ডিজিটাল সেবা, ফটো স্টুডিও ও প্রশিক্ষণ কেন্দ্র।"
        : "Hawa Computer — a reliable local digital service centre, photo studio and training institute.",
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const [page, settings] = await Promise.all([prisma.page.findUnique({ where: { slug: "about" } }), getSettings()]);
  if (!page) notFound();

  const values = [
    { icon: ShieldCheck, title: bn ? "নিরাপত্তা" : "Security", body: bn ? "গ্রাহকের ডকুমেন্ট প্রাইভেট স্টোরেজে, শুধু অনুমোদিত কর্মীর অ্যাক্সেস।" : "Customer documents sit in private storage with authorised-only access." },
    { icon: BadgeCheck, title: bn ? "স্বচ্ছতা" : "Transparency", body: bn ? "কাজ শুরুর আগেই মূল্য ও সময় জানানো হয়।" : "Price and timeline are shared before work begins." },
    { icon: HeartHandshake, title: bn ? "সহায়তা" : "Support", body: bn ? "প্রতিটি ধাপে যোগাযোগ ও সাপোর্ট টিকেট।" : "Communication and support tickets at every step." },
    { icon: Sparkles, title: bn ? "গুণমান" : "Quality", body: bn ? "অভিজ্ঞ টিম, যাচাই করা কাজ।" : "Experienced team with verified output." },
  ];

  return (
    <>
      <PageHero
        eyebrow={bn ? "আমাদের সম্পর্কে" : "About us"}
        title={pick<string>(page as never, "title", locale)}
        description={
          bn
            ? "কম্পিউটার সেবা, অনলাইন আবেদন, ফটো স্টুডিও, ডকুমেন্ট প্রস্তুতি ও প্রশিক্ষণ — এক ছাদের নিচে।"
            : "Computer services, online applications, photo studio, document preparation and training under one roof."
        }
      />

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.about }]} />

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <article className="card p-6">
            <Prose html={pick<string>(page as never, "content", locale)} />
          </article>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-base font-semibold">{bn ? "আমাদের তথ্য" : "Our details"}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{bn ? settings.addressBn : settings.addressEn}</li>
                <li><a href={`tel:${settings.phone}`} className="hover:text-royal">{settings.phone}</a></li>
                <li><a href={`mailto:${settings.email}`} className="hover:text-royal">{settings.email}</a></li>
                <li className="flex items-center gap-1.5"><Clock size={13} /> {bn ? settings.hoursBn : settings.hoursEn}</li>
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Users size={16} className="text-royal" /> {bn ? "আমাদের টিম" : "Our team"}</h2>
              <p className="mt-2 text-sm text-muted">
                {bn
                  ? "কম্পিউটার অপারেটর, ফটো এডিটর, লাইব্রেরিয়ান, প্রশিক্ষক ও অ্যাকাউন্ট্যান্ট — প্রতিটি কাজের জন্য নির্ধারিত দায়িত্ব।"
                  : "Computer operators, photo editors, a librarian, instructors and an accountant — each with a defined role."}
              </p>
            </div>
            <Link href="/contact" className="btn btn-primary w-full">{d.nav.contact}</Link>
          </aside>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div key={value.title} className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-soft text-royal">
                <value.icon size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold">{value.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
