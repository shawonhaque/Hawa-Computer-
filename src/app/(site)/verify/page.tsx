import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify certificate" };

export default async function VerifyIndexPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  return (
    <>
      <PageHero
        eyebrow={bn ? "সার্টিফিকেট" : "Certificate"}
        title={bn ? "সার্টিফিকেট যাচাই" : "Certificate verification"}
        description={bn ? "সার্টিফিকেট নম্বর লিখে যাচাই করুন।" : "Enter the certificate number to verify."}
      />
      <div className="container-page max-w-xl py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: bn ? "সার্টিফিকেট যাচাই" : "Verify certificate" }]} />
        <form action="/verify/redirect" method="get" className="card space-y-4 p-5">
          <div>
            <label htmlFor="certNo" className="label">{bn ? "সার্টিফিকেট নম্বর" : "Certificate number"}</label>
            <input id="certNo" name="certNo" required className="input" placeholder="HC-CERT-2026-XXXXXX" />
          </div>
          <button type="submit" className="btn btn-primary w-full">{bn ? "যাচাই করুন" : "Verify"}</button>
        </form>
      </div>
    </>
  );
}
