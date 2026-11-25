import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { PERMISSIONS, can } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { Input, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { issueCertificate, markAttendance, updateEnrollment } from "@/actions/admin-ops";
import { ENROLLMENT_STATUSES } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const user = await requireStaff(PERMISSIONS.ENROLLMENT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const enrollments = await prisma.enrollment.findMany({
    include: { student: { select: { name: true, email: true, phone: true } }, course: true, batch: true, certificate: true },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.students} description={bn ? "ভর্তি, ফি, অগ্রগতি ও সার্টিফিকেট।" : "Admissions, fees, progress and certificates."} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{bn ? "শিক্ষার্থী" : "Student"}</th>
              <th>{d.admin.courses}</th>
              <th>{bn ? "ব্যাচ" : "Batch"}</th>
              <th>{bn ? "ফি" : "Fee"}</th>
              <th>{bn ? "অগ্রগতি" : "Progress"}</th>
              <th>{d.common.status}</th>
              <th>{bn ? "কার্যক্রম" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>
                  <p className="font-medium">{enrollment.student.name}</p>
                  <p className="text-[0.7rem] text-muted">{enrollment.student.phone ?? enrollment.student.email}</p>
                </td>
                <td className="text-muted">{bn ? enrollment.course.titleBn : enrollment.course.titleEn}</td>
                <td className="text-muted">{enrollment.batch?.code ?? "—"}</td>
                <td className="text-muted">{formatTaka(enrollment.feePaid, locale)} / {formatTaka(enrollment.course.fee, locale)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full bg-royal" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <span className="text-[0.7rem] text-muted">{enrollment.progress}%</span>
                  </div>
                </td>
                <td><StatusBadge status={enrollment.status} locale={locale} /></td>
                <td>
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-royal">{bn ? "পরিবর্তন" : "Manage"}</summary>
                    <div className="mt-2 space-y-2">
                      <form action={updateEnrollment} className="flex flex-wrap items-center gap-1.5">
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <Select name="status" defaultValue={enrollment.status} className="h-8 w-28 text-xs">
                          {ENROLLMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </Select>
                        <Input name="feePaid" type="number" defaultValue={enrollment.feePaid} className="h-8 w-20 text-xs" />
                        <Input name="progress" type="number" min={0} max={100} defaultValue={enrollment.progress} className="h-8 w-16 text-xs" />
                        <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
                      </form>

                      <form action={markAttendance} className="flex flex-wrap items-center gap-1.5">
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-8 w-32 text-xs" />
                        <Select name="status" defaultValue="PRESENT" className="h-8 w-24 text-xs">
                          <option value="PRESENT">PRESENT</option>
                          <option value="ABSENT">ABSENT</option>
                          <option value="LATE">LATE</option>
                        </Select>
                        <SubmitButton variant="secondary" size="sm" pendingLabel="…">{bn ? "উপস্থিতি" : "Attendance"}</SubmitButton>
                      </form>

                      {can(user, PERMISSIONS.CERTIFICATE_ISSUE) ? (
                        enrollment.certificate ? (
                          <p className="text-[0.7rem] text-success">{enrollment.certificate.certNo}</p>
                        ) : (
                          <form action={issueCertificate} className="flex items-center gap-1.5">
                            <input type="hidden" name="enrollmentId" value={enrollment.id} />
                            <Input name="grade" placeholder="A+" className="h-8 w-16 text-xs" />
                            <SubmitButton variant="outline" size="sm" pendingLabel="…">{bn ? "সার্টিফিকেট" : "Certificate"}</SubmitButton>
                          </form>
                        )
                      ) : null}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 ? <tr><td colSpan={7} className="text-center text-xs text-muted">{bn ? "কোনো শিক্ষার্থী নেই।" : "No students yet."}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
