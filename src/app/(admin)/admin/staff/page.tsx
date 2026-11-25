import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Label, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveStaff, updateUserStatus } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await requireStaff(PERMISSIONS.USER_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [staff, roles] = await Promise.all([
    prisma.user.findMany({ where: { role: { isStaff: true } }, include: { role: true, staff: true }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { isStaff: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.staff} description={bn ? "স্টাফ অ্যাকাউন্ট ও রোল নির্ধারণ।" : "Staff accounts and role assignment."} />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{bn ? "নাম" : "Name"}</th><th>{d.auth.email}</th><th>{bn ? "রোল" : "Role"}</th><th>{bn ? "পদ" : "Designation"}</th><th>{d.common.status}</th><th /></tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id}>
                  <td className="font-medium">{person.name}</td>
                  <td className="text-muted">{person.email}</td>
                  <td className="text-muted">{person.role.name}</td>
                  <td className="text-muted">{person.staff?.designation ?? "—"}</td>
                  <td><StatusBadge status={person.status} locale={locale} /></td>
                  <td className="text-right">
                    <form action={updateUserStatus} className="flex items-center justify-end gap-1">
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="status" value={person.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                      <SubmitButton variant="ghost" size="sm" className="text-danger" pendingLabel="…">
                        {person.status === "ACTIVE" ? (bn ? "স্থগিত" : "Suspend") : bn ? "সক্রিয়" : "Activate"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={saveStaff} className="card h-fit space-y-3 p-4">
          <h2 className="text-sm font-semibold">{bn ? "নতুন স্টাফ" : "Add staff"}</h2>
          <div>
            <Label htmlFor="name" required>{d.auth.name}</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email" required>{d.auth.email}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password" required>{bn ? "প্রাথমিক পাসওয়ার্ড" : "Initial password"}</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div>
            <Label htmlFor="roleId" required>{bn ? "রোল" : "Role"}</Label>
            <Select id="roleId" name="roleId" required>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="designation">{bn ? "পদ" : "Designation"}</Label>
            <Input id="designation" name="designation" />
          </div>
          <SubmitButton size="sm" pendingLabel="…">{bn ? "তৈরি করুন" : "Create"}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
