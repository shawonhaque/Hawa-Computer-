import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { getSettings } from "@/lib/settings";
import { accountNav } from "@/lib/nav";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const dynamic = "force-dynamic";

// Signed-in views are not content: keep crawlers out and stop them competing with the
// public pages for the same canonical.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const locale = await getLocale();
  const d = getDict(locale);
  const settings = await getSettings();
  const bn = locale === "bn";

  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  const labels: Record<string, string> = {
    overview: d.account.overview,
    orders: d.account.orders,
    applications: d.account.applications,
    courses: d.account.courses,
    library: d.account.library,
    files: d.account.files,
    invoices: d.account.invoices,
    tickets: d.account.tickets,
    notifications: d.account.notifications,
    profile: d.account.profile,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      <DashboardSidebar
        brand={{
          name: bn ? settings.businessNameBn : settings.businessNameEn,
          tagline: bn ? settings.taglineBn : settings.taglineEn,
        }}
        groups={[{ items: accountNav.map((item) => ({ href: item.href, label: labels[item.key] ?? item.key, icon: item.icon })) }]}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={d.account.title}
          userName={user.name}
          roleName={user.role.name}
          notifications={unread}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
