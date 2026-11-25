import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatTaka } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveService } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireStaff(PERMISSIONS.CMS_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [services, categories] = await Promise.all([
    prisma.service.findMany({ include: { category: true }, orderBy: { sortOrder: "asc" } }),
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={bn ? "সেবা ব্যবস্থাপনা" : "Service management"} description={bn ? "সেবা, মূল্য ও সময় হালনাগাদ করুন।" : "Update services, prices and timelines."} />

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold">+ {bn ? "নতুন সেবা" : "New service"}</summary>
        <form action={saveService} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="nameBn" placeholder="নাম (বাংলা)" required />
            <Input name="nameEn" placeholder="Name (English)" required />
            <Input name="slug" placeholder="slug" required />
            <Select name="categoryId" required>
              <option value="" disabled>Category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
            </Select>
            <Input name="price" type="number" min={0} placeholder="Price" required />
            <Input name="processingTimeBn" placeholder="সময় (বাংলা)" required />
            <Input name="processingTimeEn" placeholder="Processing time (English)" required />
          </div>
          <Input name="summaryBn" placeholder="সংক্ষেপ (বাংলা)" />
          <Input name="summaryEn" placeholder="Summary (English)" />
          <Textarea name="descriptionBn" rows={3} placeholder="বিবরণ (বাংলা)" />
          <Textarea name="descriptionEn" rows={3} placeholder="Description (English)" />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked className="checkbox" /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" className="checkbox" /> Featured</label>
          </div>
          <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
        </form>
      </details>

      <div className="space-y-2">
        {services.map((service) => (
          <details key={service.id} className="card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{bn ? service.nameBn : service.nameEn}</span>
              <span className="flex items-center gap-2 text-xs">
                <Badge tone="info">{formatTaka(service.price, locale)}</Badge>
                <Badge tone="neutral">{service.kind}</Badge>
                {service.active ? <Badge tone="success">LIVE</Badge> : <Badge tone="neutral">OFF</Badge>}
              </span>
            </summary>
            <form action={saveService} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={service.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Name (BN)</Label><Input name="nameBn" defaultValue={service.nameBn} required /></div>
                <div><Label>Name (EN)</Label><Input name="nameEn" defaultValue={service.nameEn} required /></div>
                <div>
                  <Label>Category</Label>
                  <Select name="categoryId" defaultValue={service.categoryId} required>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
                  </Select>
                </div>
                <div><Label>Price</Label><Input name="price" type="number" defaultValue={service.price} required /></div>
                <div><Label>Time (BN)</Label><Input name="processingTimeBn" defaultValue={service.processingTimeBn} required /></div>
                <div><Label>Time (EN)</Label><Input name="processingTimeEn" defaultValue={service.processingTimeEn} required /></div>
              </div>
              <Textarea name="summaryBn" rows={2} defaultValue={service.summaryBn} />
              <Textarea name="summaryEn" rows={2} defaultValue={service.summaryEn} />
              <Textarea name="descriptionBn" rows={3} defaultValue={service.descriptionBn} />
              <Textarea name="descriptionEn" rows={3} defaultValue={service.descriptionEn} />
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={service.active} className="checkbox" /> Active</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={service.featured} className="checkbox" /> Featured</label>
              </div>
              <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
