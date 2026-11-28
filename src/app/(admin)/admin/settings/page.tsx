import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PERMISSIONS } from "@/lib/permissions";
import { Input, Label, PageHeader, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveSiteSettings } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireStaff(PERMISSIONS.SETTINGS_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const settings = await getSettings();

  return (
    <div>
      <PageHeader title={d.admin.settings} description={bn ? "ব্যবসার তথ্য, ডেলিভারি ফি ও পেমেন্ট নোট।" : "Business details, delivery fees and payment notes."} />
      <form action={saveSiteSettings} className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="businessNameBn">Business name (BN)</Label><Input id="businessNameBn" name="businessNameBn" defaultValue={settings.businessNameBn} /></div>
          <div><Label htmlFor="businessNameEn">Business name (EN)</Label><Input id="businessNameEn" name="businessNameEn" defaultValue={settings.businessNameEn} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={settings.phone} /></div>
          <div><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={settings.email} /></div>
          <div><Label htmlFor="facebook">Facebook URL</Label><Input id="facebook" name="facebook" defaultValue={settings.facebook} /></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="addressBn">Address (BN)</Label><Textarea id="addressBn" name="addressBn" rows={2} defaultValue={settings.addressBn} /></div>
          <div><Label htmlFor="addressEn">Address (EN)</Label><Textarea id="addressEn" name="addressEn" rows={2} defaultValue={settings.addressEn} /></div>
          <div><Label htmlFor="hoursBn">Hours (BN)</Label><Input id="hoursBn" name="hoursBn" defaultValue={settings.hoursBn} /></div>
          <div><Label htmlFor="hoursEn">Hours (EN)</Label><Input id="hoursEn" name="hoursEn" defaultValue={settings.hoursEn} /></div>
        </div>

        <div>
          <Label htmlFor="mapEmbedUrl">Google Maps embed URL</Label>
          <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={settings.mapEmbedUrl} placeholder="https://www.google.com/maps?q=...&output=embed" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="deliveryInside">Delivery inside city (৳)</Label><Input id="deliveryInside" name="deliveryInside" type="number" defaultValue={settings.deliveryInside} /></div>
          <div><Label htmlFor="deliveryOutside">Delivery outside city (৳)</Label><Input id="deliveryOutside" name="deliveryOutside" type="number" defaultValue={settings.deliveryOutside} /></div>
          <div><Label htmlFor="freeDeliveryAbove">Free delivery above (৳)</Label><Input id="freeDeliveryAbove" name="freeDeliveryAbove" type="number" defaultValue={settings.freeDeliveryAbove} /></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="paymentNoteBn">Payment note (BN)</Label><Textarea id="paymentNoteBn" name="paymentNoteBn" rows={3} defaultValue={settings.paymentNoteBn} /></div>
          <div><Label htmlFor="paymentNoteEn">Payment note (EN)</Label><Textarea id="paymentNoteEn" name="paymentNoteEn" rows={3} defaultValue={settings.paymentNoteEn} /></div>
        </div>

        <SubmitButton pendingLabel="…">{d.common.save}</SubmitButton>
      </form>
    </div>
  );
}
