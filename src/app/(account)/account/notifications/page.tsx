import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { markNotificationsRead, openNotification } from "@/actions/account";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={d.account.notifications}
        description={bn ? `${unread}টি অপঠিত নোটিফিকেশন` : `${unread} unread notification(s)`}
        actions={
          unread > 0 ? (
            <form action={markNotificationsRead}>
              <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>{bn ? "সব পড়া হয়েছে" : "Mark all read"}</SubmitButton>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={22} />} title={bn ? "কোনো নোটিফিকেশন নেই" : "No notifications"} body={d.empty.body} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <form key={notification.id} action={openNotification}>
              <input type="hidden" name="id" value={notification.id} />
              <button
                type="submit"
                className={`card w-full p-4 text-left transition hover:border-royal/40 ${notification.readAt ? "opacity-70" : "border-royal/25"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{notification.body}</p>
                  </div>
                  <span className="shrink-0 text-[0.65rem] text-muted">{formatDateTime(notification.createdAt, locale)}</span>
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted">
        <Link href="/account" className="text-royal">{bn ? "ড্যাশবোর্ডে ফিরুন" : "Back to dashboard"}</Link>
      </p>
    </div>
  );
}
