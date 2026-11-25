import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input, Label, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveBatch } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  await requireStaff(PERMISSIONS.COURSE_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [batches, courses, instructors] = await Promise.all([
    prisma.batch.findMany({ include: { course: true, _count: { select: { enrollments: true } } }, orderBy: { startDate: "desc" } }),
    prisma.course.findMany({ where: { active: true }, orderBy: { titleEn: "asc" } }),
    prisma.user.findMany({ where: { role: { isStaff: true }, status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.batches} description={bn ? "ব্যাচ ও ক্লাস সময়সূচি।" : "Batches and class schedules."} />
      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold">{bn ? "নতুন ব্যাচ" : "New batch"}</summary>
        <form action={saveBatch} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Course</Label>
              <Select name="courseId" required>
                <option value="" disabled>—</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.titleEn}</option>)}
              </Select>
            </div>
            <div><Label>Batch code</Label><Input name="code" placeholder="B-EXCEL-02" required /></div>
            <div><Label>Start date</Label><Input name="startDate" type="date" required /></div>
            <div><Label>End date</Label><Input name="endDate" type="date" /></div>
            <div><Label>Schedule (BN)</Label><Input name="scheduleBn" required /></div>
            <div><Label>Schedule (EN)</Label><Input name="scheduleEn" required /></div>
            <div><Label>Capacity</Label><Input name="capacity" type="number" defaultValue={20} /></div>
            <div>
              <Label>Instructor</Label>
              <Select name="instructorId">
                <option value="">—</option>
                {instructors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="checkbox" /> Active</label>
          <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
        </form>
      </details>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Code</th><th>{d.admin.courses}</th><th>{bn ? "সময়সূচি" : "Schedule"}</th><th>{bn ? "শুরু" : "Start"}</th><th>{bn ? "আসন" : "Seats"}</th><th>{d.common.status}</th></tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td className="font-mono text-xs">{batch.code}</td>
                <td className="font-medium">{bn ? batch.course.titleBn : batch.course.titleEn}</td>
                <td className="text-muted">{bn ? batch.scheduleBn : batch.scheduleEn}</td>
                <td className="text-muted">{formatDate(batch.startDate, locale)}</td>
                <td><Badge tone={batch._count.enrollments >= batch.capacity ? "danger" : "success"}>{batch._count.enrollments}/{batch.capacity}</Badge></td>
                <td>{batch.active ? <Badge tone="success">ACTIVE</Badge> : <Badge tone="neutral">OFF</Badge>}</td>
              </tr>
            ))}
            {batches.length === 0 ? <tr><td colSpan={6} className="text-center text-xs text-muted">{bn ? "কোনো ব্যাচ নেই।" : "No batches yet."}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
