import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { SignatureCutter } from "@/components/tools/signature-cutter";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "স্বাক্ষর কাটিং | হাওয়া কম্পিউটার",
  description: "কাগজে তোলা স্বাক্ষরের ব্যাকগ্রাউন্ড মুছে স্বচ্ছ PNG বানান — ই-পাসপোর্ট, এনআইডি ও ফরমের সাইজে।",
};

export default async function SignatureToolPage() {
  const locale = await getLocale();
  const bn = locale === "bn";

  return (
    <>
      <PageHero
        eyebrow={bn ? "ফ্রি টুল" : "Free tool"}
        title={bn ? "স্বাক্ষর কেটে পরিষ্কার করুন" : "Clean up a signature"}
        description={
          bn
            ? "কাগজে সাদা ব্যাকগ্রাউন্ডে স্বাক্ষর তুলে এখানে দিন — ব্যাকগ্রাউন্ড মুছে যাবে, সাইজও ঠিক হয়ে যাবে।"
            : "Photograph a signature on paper — the background disappears and the size snaps to what forms ask for."
        }
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: bn ? "হোম" : "Home", href: "/" },
            { label: bn ? "টুলস" : "Tools", href: "/tools" },
            { label: bn ? "স্বাক্ষর কাটিং" : "Signature cutter" },
          ]}
        />

        <p className="mb-5 flex items-center gap-2 text-xs text-muted">
          <Lock size={13} className="text-success" />
          {bn ? "স্বাক্ষরের ছবি সার্ভারে যায় না, ব্রাউজারেই কাটা হয়।" : "The signature never leaves your browser."}
        </p>

        <SignatureCutter en={!bn} />

        <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {bn
              ? "ই-পাসপোর্ট বা এনআইডি আবেদনে আরও সাহায্য লাগলে আমাদের আবেদন সেবা দেখুন।"
              : "Need help with an e-passport or NID application? See our application service."}
          </p>
          <Link href="/applications/passport-application" className="btn btn-secondary shrink-0 justify-center">
            {bn ? "আবেদন সেবা" : "Application service"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
