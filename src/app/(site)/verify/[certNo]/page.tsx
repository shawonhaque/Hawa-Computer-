import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Certificate verification" };

export default async function VerifyCertificatePage({ params }: { params: Promise<{ certNo: string }> }) {
  const { certNo } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const certificate = await prisma.certificate.findUnique({
    where: { certNo: decodeURIComponent(certNo) },
    include: { enrollment: { include: { student: { select: { name: true } }, course: true } } },
  });

  if (!certificate) notFound();

  const valid = !certificate.revoked;
  const studentName = certificate.enrollment.student.name;
  const masked = studentName
    .split(" ")
    .map((part, index) => (index === 0 ? part : `${part.slice(0, 1)}.`))
    .join(" ");

  return (
    <>
      <PageHero
        eyebrow={bn ? "সার্টিফিকেট" : "Certificate"}
        title={bn ? "সার্টিফিকেট যাচাই" : "Certificate verification"}
        description={bn ? "সার্টিফিকেট নম্বর দিয়ে প্রশিক্ষণ সম্পন্নের তথ্য যাচাই করুন।" : "Verify training completion using the certificate number."}
      />
      <div className="container-page max-w-2xl py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: bn ? "সার্টিফিকেট যাচাই" : "Verify certificate" }]} />

        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">{bn ? "সার্টিফিকেট নম্বর" : "Certificate number"}</p>
              <p className="text-lg font-bold tracking-wide">{certificate.certNo}</p>
            </div>
            {valid ? <Badge tone="success">{bn ? "বৈধ" : "Valid"}</Badge> : <Badge tone="danger">{bn ? "বাতিল" : "Revoked"}</Badge>}
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "শিক্ষার্থী" : "Student"}</dt>
              <dd className="font-medium">{masked}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "কোর্স" : "Course"}</dt>
              <dd className="font-medium">{bn ? certificate.enrollment.course.titleBn : certificate.enrollment.course.titleEn}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "ইস্যুর তারিখ" : "Issued on"}</dt>
              <dd className="font-medium">{formatDate(certificate.issuedAt, locale)}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "গ্রেড" : "Grade"}</dt>
              <dd className="font-medium">{certificate.grade ?? "—"}</dd>
            </div>
          </dl>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted">
            {valid ? <BadgeCheck size={15} className="mt-0.5 shrink-0 text-success" /> : <ShieldAlert size={15} className="mt-0.5 shrink-0 text-danger" />}
            {valid
              ? bn
                ? "এই সার্টিফিকেটটি আমাদের রেকর্ডে বৈধ। শুধুমাত্র প্রকাশযোগ্য তথ্য দেখানো হচ্ছে।"
                : "This certificate is valid in our records. Only publicly shareable details are shown."
              : bn
                ? "এই সার্টিফিকেটটি বাতিল করা হয়েছে। বিস্তারিত জানতে যোগাযোগ করুন।"
                : "This certificate has been revoked. Contact us for details."}
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/verify" className="text-sm font-semibold text-royal">{bn ? "অন্য সার্টিফিকেট যাচাই করুন" : "Verify another certificate"}</Link>
        </div>
      </div>
    </>
  );
}
