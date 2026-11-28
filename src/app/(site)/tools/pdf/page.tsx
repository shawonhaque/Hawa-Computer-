import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { PdfBuilder } from "@/components/tools/pdf-builder";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "ছবি থেকে PDF | হাওয়া কম্পিউটার",
  description: "একাধিক ছবি সাজিয়ে A4, Letter বা Legal সাইজের PDF বানান — সম্পূর্ণ ব্রাউজারেই, কোনো আপলোড ছাড়া।",
};

export default async function PdfToolPage() {
  const locale = await getLocale();
  const bn = locale === "bn";

  return (
    <>
      <PageHero
        eyebrow={bn ? "ফ্রি টুল" : "Free tool"}
        title={bn ? "ছবি থেকে PDF বানান" : "Turn photos into a PDF"}
        description={
          bn
            ? "স্টুডেন্ট আইডি, সার্টিফিকেট বা ডকুমেন্টের ছবি সাজিয়ে এক ফাইলে নিন — সাইজ ও মার্জিন আপনার হাতে।"
            : "Stack ID cards, certificates or documents into a single file with the page size and margin you pick."
        }
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: bn ? "হোম" : "Home", href: "/" },
            { label: bn ? "টুলস" : "Tools", href: "/tools" },
            { label: bn ? "ছবি থেকে PDF" : "Images to PDF" },
          ]}
        />

        <p className="mb-5 flex items-center gap-2 text-xs text-muted">
          <Lock size={13} className="text-success" />
          {bn
            ? "সব কাজ আপনার ব্রাউজারেই হয় — কোনো ছবি সার্ভারে যায় না।"
            : "Everything runs in your browser — no image ever leaves your device."}
        </p>

        <PdfBuilder en={!bn} />

        <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {bn
              ? "প্রিন্ট বা লেমিনেট করাতে চান? দোকানে নিয়ে আসুন, বা WhatsApp-এ ফাইল পাঠান।"
              : "Need it printed or laminated? Bring it to the shop or send the file on WhatsApp."}
          </p>
          <Link href="/services/printing-photocopy" className="btn btn-secondary shrink-0 justify-center">
            {bn ? "প্রিন্ট সার্ভিস" : "Printing service"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
