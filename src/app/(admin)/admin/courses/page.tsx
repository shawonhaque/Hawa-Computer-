import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveCourse } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await requireStaff(PERMISSIONS.COURSE_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const courses = await prisma.course.findMany({ include: { _count: { select: { enrollments: true, batches: true } } }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.courses} description={bn ? "কোর্স তৈরি ও সম্পাদনা।" : "Create and edit courses."} />
      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold">{bn ? "নতুন কোর্স" : "New course"}</summary>
        <form action={saveCourse} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="titleBn" placeholder={bn ? "শিরোনাম (বাংলা)" : "Title (Bangla)"} required />
            <Input name="titleEn" placeholder={bn ? "শিরোনাম (ইংরেজি)" : "Title (English)"} required />
            <Input name="slug" placeholder="slug" required />
            <Input name="fee" type="number" min={0} placeholder={bn ? "কোর্স ফি" : "Fee"} required />
            <Input name="durationWeeks" type="number" min={1} defaultValue={4} placeholder={bn ? "সপ্তাহ" : "Weeks"} />
            <Select name="level" defaultValue="BEGINNER">
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </Select>
          </div>
          <Input name="summaryBn" placeholder={bn ? "সংক্ষেপ (বাংলা)" : "Summary (Bangla)"} />
          <Input name="summaryEn" placeholder={bn ? "সংক্ষেপ (ইংরেজি)" : "Summary (English)"} />
          <Textarea name="descriptionBn" rows={2} placeholder={bn ? "বিবরণ (বাংলা)" : "Description (Bangla)"} />
          <Textarea name="descriptionEn" rows={2} placeholder={bn ? "বিবরণ (ইংরেজি)" : "Description (English)"} />
          <Textarea name="syllabus" rows={4} placeholder={bn ? "সিলেবাস — প্রতি লাইনে একটি টপিক" : "Syllabus — one topic per line"} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="checkbox" /> {bn ? "সক্রিয়" : "Active"}</label>
          <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
        </form>
      </details>

      <div className="space-y-3">
        {courses.map((course) => (
          <details key={course.id} className="card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{bn ? course.titleBn : course.titleEn}</span>
              <span className="flex items-center gap-2 text-xs">
                <Badge tone="info">{formatTaka(course.fee, locale)}</Badge>
                <Badge tone="neutral">{course._count.enrollments} {bn ? "শিক্ষার্থী" : "students"}</Badge>
                <Badge tone="neutral">{course._count.batches} {bn ? "ব্যাচ" : "batches"}</Badge>
                {course.active ? <Badge tone="success">ACTIVE</Badge> : <Badge tone="danger">OFF</Badge>}
              </span>
            </summary>
            <form action={saveCourse} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={course.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Title (BN)</Label><Input name="titleBn" defaultValue={course.titleBn} required /></div>
                <div><Label>Title (EN)</Label><Input name="titleEn" defaultValue={course.titleEn} required /></div>
                <div><Label>Slug</Label><Input name="slug" defaultValue={course.slug} required /></div>
                <div><Label>Fee</Label><Input name="fee" type="number" defaultValue={course.fee} required /></div>
                <div><Label>Weeks</Label><Input name="durationWeeks" type="number" defaultValue={course.durationWeeks} /></div>
                <div>
                  <Label>Level</Label>
                  <Select name="level" defaultValue={course.level}>
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </Select>
                </div>
              </div>
              <Textarea name="summaryBn" rows={2} defaultValue={course.summaryBn} />
              <Textarea name="summaryEn" rows={2} defaultValue={course.summaryEn} />
              <Textarea name="descriptionBn" rows={3} defaultValue={course.descriptionBn} />
              <Textarea name="descriptionEn" rows={3} defaultValue={course.descriptionEn} />
              <Textarea name="syllabus" rows={5} defaultValue={((course.syllabus as string[]) ?? []).join("\n")} />
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={course.active} className="checkbox" /> Active</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={course.featured} className="checkbox" /> Featured</label>
              </div>
              <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
            </form>
          </details>
        ))}
        {courses.length === 0 ? <p className="text-sm text-muted">{bn ? "কোনো কোর্স নেই।" : "No courses yet."}</p> : null}
      </div>
    </div>
  );
}
