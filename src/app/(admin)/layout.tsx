import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { getSettings } from "@/lib/settings";
import { adminNavGroups } from "@/lib/nav";
import { can } from "@/lib/permissions";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const locale = await getLocale();
  const d = getDict(locale);
  const settings = await getSettings();
  const bn = locale === "bn";

  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  const groups = adminNavGroups
    .map((group) => ({
      label: group.label,
      items: group.items
        .filter((item) => !item.permission || can(user, item.permission))
        .map((item) => ({
          href: item.href,
          label: (d.admin as Record<string, string>)[item.key] ?? item.key,
          icon: item.icon,
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      <DashboardSidebar
        brand={{
          name: bn ? settings.businessNameBn : settings.businessNameEn,
          tagline: bn ? settings.taglineBn : settings.taglineEn,
        }}
        homeHref="/admin"
        groups={groups}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={d.admin.dashboard}
          userName={user.name}
          roleName={user.role.name}
          notifications={unread}
          backHref="/"
          backLabel={bn ? "সাইট দেখুন" : "View site"}
          profileHref="/admin"
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
