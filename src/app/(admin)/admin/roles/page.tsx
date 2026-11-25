import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveRole } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireStaff(PERMISSIONS.ROLE_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const roles = await prisma.role.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } });

  return (
    <div className="space-y-5">
      <PageHeader title={d.admin.roles} description={bn ? "প্রতিটি রোলের অনুমতি নির্ধারণ করুন।" : "Configure permissions for each role."} />

      <div className="space-y-4">
        {roles.map((role) => {
          const permissions = (role.permissions as string[]) ?? [];
          const isSuper = role.slug === "super-admin";
          return (
            <details key={role.id} className="card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{role.name} <span className="font-normal text-muted">({role.slug})</span></span>
                <span className="text-xs text-muted">{role._count.users} {bn ? "ব্যবহারকারী" : "users"} · {isSuper ? (bn ? "সব অনুমতি" : "all permissions") : `${permissions.length} permissions`}</span>
              </summary>

              {isSuper ? (
                <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">
                  {bn ? "সুপার অ্যাডমিনের সব অনুমতি স্বয়ংক্রিয়ভাবে থাকে।" : "Super admin always has every permission."}
                </p>
              ) : (
                <form action={saveRole} className="mt-4 space-y-4">
                  <input type="hidden" name="id" value={role.id} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-muted">{group.label}</p>
                        <div className="space-y-1">
                          {group.permissions.map((permission) => (
                            <label key={permission} className="flex items-start gap-2 text-xs text-muted">
                              <input type="checkbox" name="permissions" value={permission} defaultChecked={permissions.includes(permission)} className="checkbox" />
                              <span>{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
                </form>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
