import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input, PageHeader, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { moderateReview, moderateTestimonial, saveFaq, savePage } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireStaff(PERMISSIONS.CMS_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [pages, faqs, testimonials, reviews] = await Promise.all([
    prisma.page.findMany({ orderBy: { slug: "asc" } }),
    prisma.faq.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ where: { approved: false }, include: { product: { select: { nameEn: true } }, user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={d.admin.content} description={bn ? "পেজ, প্রশ্নোত্তর, টেস্টিমোনিয়াল ও রিভিউ।" : "Pages, FAQs, testimonials and reviews."} />

      <section>
        <h2 className="mb-2 text-sm font-semibold">{bn ? "ওয়েবসাইট পেজ" : "Website pages"}</h2>
        <div className="space-y-2">
          {pages.map((page) => (
            <details key={page.id} className="card p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
                <span>/{page.slug}</span>
                {page.published ? <Badge tone="success">LIVE</Badge> : <Badge tone="neutral">DRAFT</Badge>}
              </summary>
              <form action={savePage} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={page.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input name="titleBn" defaultValue={page.titleBn} required />
                  <Input name="titleEn" defaultValue={page.titleEn} required />
                </div>
                <Textarea name="contentBn" rows={5} defaultValue={page.contentBn} />
                <Textarea name="contentEn" rows={5} defaultValue={page.contentEn} />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={page.published} className="checkbox" /> Published</label>
                <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
              </form>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">{bn ? "প্রশ্নোত্তর" : "FAQs"}</h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details key={faq.id} className="card p-4">
              <summary className="cursor-pointer text-sm font-medium">{faq.questionEn}</summary>
              <form action={saveFaq} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={faq.id} />
                <Input name="questionBn" defaultValue={faq.questionBn} required />
                <Input name="questionEn" defaultValue={faq.questionEn} required />
                <Textarea name="answerBn" rows={3} defaultValue={faq.answerBn} />
                <Textarea name="answerEn" rows={3} defaultValue={faq.answerEn} />
                <div className="flex items-center gap-3">
                  <Input name="sortOrder" type="number" defaultValue={faq.sortOrder} className="max-w-24" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={faq.active} className="checkbox" /> Active</label>
                  <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
                </div>
              </form>
            </details>
          ))}
          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold">+ {bn ? "নতুন প্রশ্ন" : "New FAQ"}</summary>
            <form action={saveFaq} className="mt-3 space-y-2">
              <Input name="questionBn" placeholder="প্রশ্ন (বাংলা)" required />
              <Input name="questionEn" placeholder="Question (English)" required />
              <Textarea name="answerBn" rows={3} placeholder="উত্তর (বাংলা)" />
              <Textarea name="answerEn" rows={3} placeholder="Answer (English)" />
              <Input name="sortOrder" type="number" defaultValue={faqs.length} className="max-w-24" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="checkbox" /> Active</label>
              <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
            </form>
          </details>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">{bn ? "টেস্টিমোনিয়াল" : "Testimonials"}</h2>
          <div className="space-y-2">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="card flex items-start justify-between gap-2 p-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="line-clamp-2 text-xs text-muted">{testimonial.messageEn}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {testimonial.approved ? <Badge tone="success">LIVE</Badge> : (
                    <form action={moderateTestimonial}>
                      <input type="hidden" name="id" value={testimonial.id} />
                      <input type="hidden" name="decision" value="APPROVE" />
                      <SubmitButton size="sm" pendingLabel="…">{bn ? "অনুমোদন" : "Approve"}</SubmitButton>
                    </form>
                  )}
                  <form action={moderateTestimonial}>
                    <input type="hidden" name="id" value={testimonial.id} />
                    <input type="hidden" name="decision" value="DELETE" />
                    <SubmitButton variant="ghost" size="sm" className="text-danger" pendingLabel="…">{d.common.delete}</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">{bn ? "অপেক্ষমাণ রিভিউ" : "Pending reviews"}</h2>
          <div className="space-y-2">
            {reviews.map((review) => (
              <div key={review.id} className="card flex items-start justify-between gap-2 p-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{review.product.nameEn} · {review.rating}★</p>
                  <p className="text-xs text-muted">{review.user.name}: {review.comment ?? "—"}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <form action={moderateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="decision" value="APPROVE" />
                    <SubmitButton size="sm" pendingLabel="…">{bn ? "অনুমোদন" : "Approve"}</SubmitButton>
                  </form>
                  <form action={moderateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="decision" value="DELETE" />
                    <SubmitButton variant="ghost" size="sm" className="text-danger" pendingLabel="…">{d.common.delete}</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
            {reviews.length === 0 ? <p className="text-xs text-muted">{bn ? "কোনো অপেক্ষমাণ রিভিউ নেই।" : "No pending reviews."}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
