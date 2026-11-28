import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { ImageCompressor } from "@/components/tools/image-compressor";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "ছবি ছোট করুন | হাওয়া কম্পিউটার",
  description: "ছবির সাইজ কমান, প্রস্থ ঠিক করুন, JPG / PNG / WebP বানান — অনলাইন আবেদনের ফাইল সাইজ লিমিটে ফিট করুন।",
};

export default async function ImageToolPage() {
  const locale = await getLocale();
  const bn = locale === "bn";

  return (
    <>
      <PageHero
        eyebrow={bn ? "ফ্রি টুল" : "Free tool"}
        title={bn ? "ছবি ছোট করুন, সাইজ ঠিক করুন" : "Compress, resize and convert photos"}
        description={
          bn
            ? "অনলাইন আবেদনে ছবি জমা দিতে ১০০ KB বা ৩০০×৩০০ পিক্সেল লাগে? এখানেই ঠিক সাইজে বানিয়ে নিন।"
            : "Applications often demand 100 KB or 300×300 px. Get the exact size here in one pass."
        }
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: bn ? "হোম" : "Home", href: "/" },
            { label: bn ? "টুলস" : "Tools", href: "/tools" },
            { label: bn ? "ছবি ছোট করুন" : "Compress & resize" },
          ]}
        />

        <p className="mb-5 flex items-center gap-2 text-xs text-muted">
          <Lock size={13} className="text-success" />
          {bn
            ? "ছবি কোথাও আপলোড হয় না — ব্রাউজারেই প্রসেস হয়।"
            : "Nothing is uploaded — the browser does the work."}
        </p>

        <ImageCompressor en={!bn} />

        <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {bn
              ? "পাসপোর্ট সাইজ ছবি বা সাইন করতে সাহায্য লাগবে? ফটো স্টুডিও সার্ভিস দেখুন।"
              : "Need a passport photo or a print? Have a look at the photo studio service."}
          </p>
          <Link href="/services/passport-size-photo" className="btn btn-secondary shrink-0 justify-center">
            {bn ? "ফটো স্টুডিও" : "Photo studio"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
