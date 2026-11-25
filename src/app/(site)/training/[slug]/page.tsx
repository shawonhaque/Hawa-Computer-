import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { formatDate, formatTaka } from "@/lib/utils";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { enrollCourse } from "@/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return { title: "Course" };
  return { title: pick<string>(course as never, "title", locale), description: pick<string>(course as never, "summary", locale) };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      batches: {
        where: { active: true },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!course || !course.active) notFound();

  const syllabus = (course.syllabus as string[]) ?? [];
  const enrollment = user
    ? await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: user.id, courseId: course.id } } })
    : null;

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: d.nav.home, href: "/" },
          { label: d.nav.training, href: "/training" },
          { label: pick<string>(course as never, "title", locale) },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cyan">{course.level}</Badge>
            <Badge tone="neutral">{course.durationWeeks} {bn ? "সপ্তাহ" : "weeks"}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{pick<string>(course as never, "title", locale)}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{pick<string>(course as never, "description", locale)}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Clock, label: bn ? "সময়কাল" : "Duration", value: `${course.durationWeeks} ${bn ? "সপ্তাহ" : "weeks"}` },
              { icon: Award, label: bn ? "কোর্স ফি" : "Course fee", value: formatTaka(course.fee, locale) },
              { icon: CalendarDays, label: bn ? "ব্যাচ" : "Batches", value: String(course.batches.length) },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <item.icon size={16} className="text-royal" />
                <p className="mt-2 text-xs text-muted">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {syllabus.length > 0 ? (
            <section className="card mt-6 p-5">
              <h2 className="text-base font-semibold">{bn ? "কোর্স সিলেবাস" : "Course syllabus"}</h2>
              <ol className="mt-3 space-y-2 text-sm text-muted">
                {syllabus.map((topic, index) => (
                  <li key={topic} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal-soft text-[0.65rem] font-bold text-royal">
                      {index + 1}
                    </span>
                    {topic}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="card h-fit p-5">
          <h2 className="text-base font-semibold">{bn ? "ভর্তি হোন" : "Enrol now"}</h2>
          <p className="mt-1 text-2xl font-bold text-royal">{formatTaka(course.fee, locale)}</p>

          {enrollment ? (
            <div className="mt-4 rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 size={15} className="mr-1 inline" />
              {bn ? "আপনি ইতিমধ্যে ভর্তি হয়েছেন" : "You are already enrolled"}
            </div>
          ) : (
            <form action={enrollCourse} className="mt-4 space-y-3">
              <input type="hidden" name="courseId" value={course.id} />
              {course.batches.length > 0 ? (
                <div>
                  <label htmlFor="batchId" className="label">{bn ? "ব্যাচ নির্বাচন করুন" : "Choose a batch"}</label>
                  <select id="batchId" name="batchId" className="select" required>
                    {course.batches.map((batch) => {
                      const seats = batch.capacity - batch._count.enrollments;
                      return (
                        <option key={batch.id} value={batch.id} disabled={seats <= 0}>
                          {locale === "bn" ? batch.scheduleBn : batch.scheduleEn} · {formatDate(batch.startDate, locale)} · {seats} {bn ? "আসন" : "seats"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}
              {user ? (
                <SubmitButton className="w-full" pendingLabel={d.common.loading}>
                  {bn ? "ভর্তির আবেদন করুন" : "Apply for admission"}
                </SubmitButton>
              ) : (
                <Link href={`/login?next=/training/${course.slug}`} className="btn btn-primary w-full">
                  {bn ? "ভর্তির জন্য লগইন করুন" : "Log in to enrol"}
                </Link>
              )}
              <p className="text-[0.7rem] text-muted">
                {bn ? "কোর্স ফি দোকানে নগদ বা মোবাইল ব্যাংকিংয়ে পরিশোধ করা যায়।" : "Course fee can be paid at the shop or via mobile banking."}
              </p>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
