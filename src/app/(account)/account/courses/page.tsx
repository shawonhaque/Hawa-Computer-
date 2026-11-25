import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountCoursesPage() {
  const user = await requireUser("/account/courses");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: { course: true, batch: true, certificate: true },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.account.courses} description={bn ? "কোর্সের অগ্রগতি, ব্যাচ ও সার্টিফিকেট।" : "Course progress, batch and certificate."} />
      {enrollments.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={22} />}
          title={d.account.noCourses}
          body={d.empty.body}
          action={<Link href="/training" className="btn btn-primary btn-sm">{d.nav.training}</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{bn ? enrollment.course.titleBn : enrollment.course.titleEn}</h3>
                <StatusBadge status={enrollment.status} locale={locale} />
              </div>
              {enrollment.batch ? (
                <p className="mt-1 text-xs text-muted">
                  {bn ? enrollment.batch.scheduleBn : enrollment.batch.scheduleEn} · {formatDate(enrollment.batch.startDate, locale)}
                </p>
              ) : null}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{bn ? "অগ্রগতি" : "Progress"}</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-royal to-cyan" style={{ width: `${enrollment.progress}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted">{bn ? "ফি পরিশোধ" : "Fee paid"}: {formatTaka(enrollment.feePaid, locale)} / {formatTaka(enrollment.course.fee, locale)}</span>
                {enrollment.certificate ? (
                  <Link href={`/verify/${enrollment.certificate.certNo}`} className="font-semibold text-royal">{bn ? "সার্টিফিকেট" : "Certificate"} →</Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
