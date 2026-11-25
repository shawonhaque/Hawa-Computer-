import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { Input, Label, PageHeader, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword, requestAccountDeletion, updateProfile } from "@/actions/account";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const profile = await prisma.customerProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <PageHeader title={d.account.profile} description={bn ? "আপনার তথ্য হালনাগাদ করুন।" : "Keep your details up to date."} />

      <div className="grid gap-5 lg:grid-cols-2">
        <form action={updateProfile} className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold">{bn ? "ব্যক্তিগত তথ্য" : "Personal information"}</h2>
          <div>
            <Label htmlFor="name" required>{d.auth.name}</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div>
            <Label htmlFor="email">{d.auth.email}</Label>
            <Input id="email" defaultValue={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="phone" required>{d.auth.phone}</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} required />
          </div>
          <div>
            <Label htmlFor="address">{d.shop.address}</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={profile?.address ?? ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">{d.shop.city}</Label>
              <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
            </div>
            <div>
              <Label htmlFor="district">{bn ? "জেলা" : "District"}</Label>
              <Input id="district" name="district" defaultValue={profile?.district ?? ""} />
            </div>
            <div>
              <Label htmlFor="postcode">{bn ? "পোস্ট কোড" : "Postcode"}</Label>
              <Input id="postcode" name="postcode" defaultValue={profile?.postcode ?? ""} />
            </div>
          </div>
          <SubmitButton pendingLabel={d.common.loading}>{d.common.save}</SubmitButton>
        </form>

        <div className="space-y-5">
          <form action={changePassword} className="card space-y-3 p-5">
            <h2 className="text-sm font-semibold">{bn ? "পাসওয়ার্ড পরিবর্তন" : "Change password"}</h2>
            <div>
              <Label htmlFor="currentPassword" required>{bn ? "বর্তমান পাসওয়ার্ড" : "Current password"}</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div>
              <Label htmlFor="newPassword" required>{bn ? "নতুন পাসওয়ার্ড" : "New password"}</Label>
              <Input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirmPassword" required>{d.auth.confirmPassword}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <SubmitButton variant="secondary" pendingLabel={d.common.loading}>{d.common.update}</SubmitButton>
          </form>

          <form action={requestAccountDeletion} className="card space-y-3 border-danger/25 p-5">
            <h2 className="text-sm font-semibold text-danger">{d.account.deleteAccount}</h2>
            <p className="text-xs text-muted">
              {bn ? "অনুরোধ পাঠালে আমাদের টিম আপনার অ্যাকাউন্ট ও ব্যক্তিগত তথ্য মুছে ফেলবে।" : "Our team will review and delete your account and personal data."}
            </p>
            <Textarea name="reason" rows={2} placeholder={bn ? "কারণ (ঐচ্ছিক)" : "Reason (optional)"} />
            <SubmitButton variant="danger" size="sm" pendingLabel={d.common.loading}>{bn ? "অনুরোধ পাঠান" : "Send request"}</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
