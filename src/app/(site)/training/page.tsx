import type { Metadata } from "next";
import Link from "next/link";
import { Award, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { CourseCard } from "@/components/site/cards";
import { EmptyState } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "কম্পিউটার প্রশিক্ষণ" : "Computer Training",
    description:
      locale === "bn"
        ? "বেসিক কম্পিউটার, এক্সেল, গ্রাফিক ডিজাইন, টাইপিং ও অনলাইন আবেদন প্রশিক্ষণ — সার্টিফিকেটসহ।"
        : "Basic computer, Excel, graphic design, typing and online application training — with certificates.",
  };
}

export default async function TrainingPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const courses = await prisma.course.findMany({
    where: { active: true },
    include: { batches: { where: { active: true }, orderBy: { startDate: "asc" } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHero
        eyebrow={bn ? "প্রশিক্ষণ" : "Training"}
        title={bn ? "কম্পিউটার প্রশিক্ষণ কোর্স" : "Computer training courses"}
        description={
          bn
            ? "হাতে-কলমে প্রশিক্ষণ, অভিজ্ঞ প্রশিক্ষক এবং কোর্স শেষে যাচাইযোগ্য সার্টিফিকেট।"
            : "Hands-on training, experienced instructors and a verifiable certificate on completion."
        }
      />

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.training }]} />

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Users, title: bn ? "ছোট ব্যাচ" : "Small batches", body: bn ? "প্রতি ব্যাচে সর্বোচ্চ ২০ জন" : "Maximum 20 students per batch" },
            { icon: Clock, title: bn ? "নমনীয় সময়" : "Flexible timing", body: bn ? "সকাল ও সন্ধ্যার ব্যাচ" : "Morning and evening batches" },
            { icon: Award, title: bn ? "সার্টিফিকেট" : "Certificate", body: bn ? "অনলাইনে যাচাইযোগ্য সার্টিফিকেট" : "Certificate verifiable online" },
          ].map((item) => (
            <div key={item.title} className="card flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal-soft text-royal">
                <item.icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 ? (
          <EmptyState title={d.empty.title} body={d.empty.body} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course as never}
                locale={locale}
                enrollLabel={d.common.applyNow}
                weeksLabel={bn ? "সপ্তাহ" : "weeks"}
              />
            ))}
          </div>
        )}

        <div className="mt-10 card p-5">
          <h2 className="text-base font-semibold">{bn ? "আসন্ন ব্যাচ" : "Upcoming batches"}</h2>
          <div className="mt-3 space-y-2">
            {courses.flatMap((course) =>
              course.batches.map((batch) => (
                <div key={batch.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{locale === "bn" ? course.titleBn : course.titleEn}</p>
                    <p className="text-xs text-muted">{locale === "bn" ? batch.scheduleBn : batch.scheduleEn}</p>
                  </div>
                  <Link href={`/training/${course.slug}`} className="text-xs font-semibold text-royal">{d.common.details} →</Link>
                </div>
              )),
            )}
            {courses.every((course) => course.batches.length === 0) ? (
              <p className="text-sm text-muted">{bn ? "নতুন ব্যাচের ঘোষণা শীঘ্রই।" : "New batches will be announced soon."}</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
