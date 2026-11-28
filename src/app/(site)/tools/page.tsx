import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  ExternalLink,
  FileText,
  ImageDown,
  PenTool,
  Printer,
  Sparkles,
  Wrench,
} from "lucide-react";
import { PageHero } from "@/components/site/breadcrumbs";
import { getLocale } from "@/lib/i18n";
import { SITE_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "টুলস ও প্যাকেজ | হাওয়া কম্পিউটার",
  description:
    "ফটো স্টুডিও, ডকুমেন্ট, অনলাইন আবেদন, প্রিন্ট ও দোকানের সব টুল আর প্যাকেজ এক জায়গায় — হাওয়া কম্পিউটার।",
};

type Tool = { label: string; href: string; note?: string };

const groups: { key: string; titleBn: string; titleEn: string; icon: typeof Camera; items: Tool[] }[] = [
  {
    key: "photo",
    titleBn: "ফটো স্টুডিও",
    titleEn: "Photo studio",
    icon: Camera,
    items: [
      { label: "পাসপোর্ট সাইজ ছবি", href: "/services/passport-size-photo" },
      { label: "ভিসা সাইজ ছবি", href: "/services/visa-size-photo" },
      { label: "ছবি রিটাচিং", href: "/services/photo-retouching" },
      { label: "ডকুমেন্ট স্ক্যানিং", href: "/services/document-scanning" },
      { label: "ফটো স্টুডিও প্যাকেজ", href: "/services/printing-photocopy" },
    ],
  },
  {
    key: "document",
    titleBn: "ডকুমেন্ট ও টাইপিং",
    titleEn: "Documents & typing",
    icon: FileText,
    items: [
      { label: "বাংলা টাইপিং", href: "/services/bangla-typing" },
      { label: "ইংরেজি টাইপিং", href: "/services/english-typing" },
      { label: "সিভি / বায়োডাটা", href: "/services/cv-biodata-typing" },
      { label: "PDF এডিটিং", href: "/services/pdf-editing" },
      { label: "এফিডেভিট টাইপিং", href: "/services/affidavit-typing" },
    ],
  },
  {
    key: "application",
    titleBn: "অনলাইন আবেদন",
    titleEn: "Online applications",
    icon: BadgeCheck,
    items: [
      { label: "ই-পাসপোর্ট আবেদন", href: "/applications/passport-application" },
      { label: "পাসপোর্ট নবায়ন", href: "/applications/passport-renewal" },
      { label: "এনআইডি সংশোধন", href: "/applications/nid-correction" },
      { label: "জন্ম নিবন্ধন", href: "/applications/birth-registration" },
      { label: "চাকরির আবেদন", href: "/applications/job-application" },
      { label: "স্কুল / কলেজ / বিশ্ববিদ্যালয় ভর্তি", href: "/applications/school-admission" },
    ],
  },
  {
    key: "print",
    titleBn: "প্রিন্ট ও দোকান",
    titleEn: "Print & shop",
    icon: Printer,
    items: [
      { label: "প্রিন্ট ও ফটোকপি", href: "/services/printing-photocopy" },
      { label: "স্টেশনারি শপ", href: "/shop" },
      { label: "বই ও লাইব্রেরি", href: "/library" },
      { label: "কম্পিউটার প্রশিক্ষণ", href: "/training" },
      { label: "সার্টিফিকেট যাচাই", href: "/verify" },
    ],
  },
];

const packages = [
  {
    nameBn: "স্টুডেন্ট প্যাকেজ",
    nameEn: "Student package",
    price: "৳ ৫০০",
    priceEn: "৳ 500",
    featuresBn: ["১০টি পাসপোর্ট সাইজ ছবি", "২টি ডকুমেন্ট টাইপিং", "২০ পৃষ্ঠা প্রিন্ট", "১টি অনলাইন আবেদন"],
    featuresEn: ["10 passport-size photos", "2 document typing jobs", "20 pages of printing", "1 online application"],
    highlight: false,
  },
  {
    nameBn: "শপ প্যাকেজ",
    nameEn: "Shop package",
    price: "৳ ১,৫০০",
    priceEn: "৳ 1,500",
    featuresBn: ["৩০টি পাসপোর্ট সাইজ ছবি", "৫টি ডকুমেন্ট টাইপিং", "১০০ পৃষ্ঠা প্রিন্ট", "৩টি অনলাইন আবেদন", "অগ্রাধিকার সাপোর্ট"],
    featuresEn: ["30 passport-size photos", "5 document typing jobs", "100 pages of printing", "3 online applications", "Priority support"],
    highlight: true,
  },
  {
    nameBn: "বিজনেস প্যাকেজ",
    nameEn: "Business package",
    price: "৳ ৩,০০০",
    priceEn: "৳ 3,000",
    featuresBn: ["আনলিমিটেড ছবি (মাসিক)", "১০টি ডকুমেন্ট টাইপিং", "৩০০ পৃষ্ঠা প্রিন্ট", "৫টি অনলাইন আবেদন", "ডেডিকেটেড সাপোর্ট"],
    featuresEn: ["Unlimited photos (monthly)", "10 document typing jobs", "300 pages of printing", "5 online applications", "Dedicated support"],
    highlight: false,
  },
];

const importantLinks = [
  { label: "e-Passport", labelBn: "ই-পাসপোর্ট", href: "https://www.epassport.gov.bd" },
  { label: "NID Services", labelBn: "এনআইডি সেবা", href: "https://services.nidw.gov.bd" },
  { label: "Birth Registration", labelBn: "জন্ম নিবন্ধন", href: "https://bdris.gov.bd" },
  { label: "Education Board Results", labelBn: "শিক্ষা বোর্ড ফলাফল", href: "https://educationboardresults.gov.bd" },
  { label: "NBR TIN", labelBn: "এনবিআর টিআইএন", href: "https://etaxnbr.gov.bd" },
  { label: "Ministry of Land", labelBn: "ভূমি মন্ত্রণালয়", href: "https://minland.gov.bd" },
];

const TOOL_ICONS = { photo: Camera, pdf: FileText, image: ImageDown, signature: PenTool } as const;

export default async function ToolsPage() {
  const locale = await getLocale();
  const bn = locale === "bn";

  return (
    <>
      <PageHero
        eyebrow={bn ? "ফ্রি টুলস" : "Free tools"}
        title={bn ? "আপনার সব ডিজিটাল কাজ, এক ঠিকানায়" : "All your digital work in one place"}
        description={
          bn
            ? "কম্পিউটার শপ ও স্টুডিওর জন্য ছবি, ডকুমেন্ট, অনলাইন আবেদন, প্রিন্ট আর দোকানের সব সেবা — একটি পেজ থেকে শুরু করুন।"
            : "Photo, documents, online applications, printing and shop services for computer shops and studios — start everything from one page."
        }
      />

      <section id="tools" className="container-page -mt-6 pb-2">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SITE_TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="card group flex flex-col gap-2 border-royal/25 p-4 transition hover:-translate-y-0.5 hover:border-royal/50 hover:shadow-lg"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-royal-soft text-royal">
                  <Icon size={18} />
                </span>
                <p className="text-sm font-bold">{bn ? tool.bn : tool.en}</p>
                <p className="text-xs leading-relaxed text-muted">{bn ? tool.noteBn : tool.noteEn}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-royal">
                  {bn ? "ব্যবহার করুন" : "Open"} <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.key} className="card flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-royal-soft text-royal">
                    <Icon size={17} />
                  </span>
                  <h2 className="text-sm font-bold">{bn ? group.titleBn : group.titleEn}</h2>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-start gap-1.5 text-[0.82rem] leading-snug text-muted transition hover:text-royal"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-royal/50" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface-2/60 py-10 sm:py-14">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-royal">{bn ? "প্যাকেজ" : "Packages"}</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                {bn ? "একবারে অনেক কাজ, কম খরচে" : "Bundle your work, save more"}
              </h2>
            </div>
            <Link href="/contact" className="hidden items-center gap-1 text-sm font-semibold text-royal sm:inline-flex">
              {bn ? "কাস্টম প্যাকেজ" : "Custom package"} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.nameEn}
                className={`card flex flex-col p-5 ${pkg.highlight ? "ring-2 ring-royal" : ""}`}
              >
                {pkg.highlight ? (
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-royal px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    <Sparkles size={11} /> {bn ? "জনপ্রিয়" : "Popular"}
                  </span>
                ) : null}
                <h3 className="text-sm font-bold">{bn ? pkg.nameBn : pkg.nameEn}</h3>
                <p className="mt-2 text-2xl font-extrabold text-royal">{bn ? pkg.price : pkg.priceEn}</p>
                <ul className="mt-4 space-y-2">
                  {(bn ? pkg.featuresBn : pkg.featuresEn).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.82rem] text-muted">
                      <Check size={14} className="mt-0.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="btn btn-primary btn-sm mt-5 w-full justify-center">
                  {bn ? "অর্ডার করুন" : "Order now"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Wrench size={17} className="text-royal" />
              <h2 className="text-sm font-bold">{bn ? "গুরুত্বপূর্ণ সরকারি লিংক" : "Important official links"}</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              {bn
                ? "সরকারি পোর্টালে আমরা সরাসরি সহায়তা করি না — নিচের অফিসিয়াল লিংক থেকে নিজে আবেদন করতে পারেন, অথবা আমাদের শপে এসে সহায়তা নিতে পারেন।"
                : "We are not a government portal. Apply yourself from the official links below, or visit our shop for assistance."}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {importantLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[0.82rem] transition hover:border-royal hover:text-royal"
                  >
                    <span>{bn ? link.labelBn : link.label}</span>
                    <ExternalLink size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="card flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-royal" />
                <h2 className="text-sm font-bold">{bn ? "কোথা থেকে শুরু করবেন?" : "Where to start?"}</h2>
              </div>
              <ul className="mt-3 space-y-2 text-[0.85rem] text-muted">
                <li className="flex gap-2">
                  <span className="font-bold text-royal">১.</span>
                  {bn ? "যে সেবা দরকার সেটি বেছে নিন (ছবি, টাইপিং, আবেদন, প্রিন্ট)।" : "Pick the service you need (photo, typing, application, print)."}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-royal">২.</span>
                  {bn ? "ফাইল আপলোড করে অর্ডার দিন — দাম সাথে সাথেই দেখতে পাবেন।" : "Upload your files and order — you see the price instantly."}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-royal">৩.</span>
                  {bn ? "অর্ডার আইডি দিয়ে ট্র্যাক করুন, দোকান থেকে সংগ্রহ করুন বা ডেলিভারি নিন।" : "Track with your order ID, then collect from the shop or get delivery."}
                </li>
              </ul>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/services" className="btn btn-primary btn-sm">
                {bn ? "সেবা দেখুন" : "Browse services"}
              </Link>
              <Link href="/contact" className="btn btn-ghost btn-sm">
                {bn ? "যোগাযোগ" : "Contact"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
