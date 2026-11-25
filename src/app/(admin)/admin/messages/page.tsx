import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateContactMessage } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <PageHeader title={d.admin.messages} description={bn ? "ওয়েবসাইটের যোগাযোগ ফর্মের বার্তা।" : "Messages from the website contact form."} />
      {messages.length === 0 ? (
        <EmptyState title={bn ? "কোনো বার্তা নেই" : "No messages"} body={d.empty.body} />
      ) : (
        <div className="space-y-2">
          {messages.map((message) => (
            <div key={message.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">{message.subject}</p>
                  <p className="text-[0.7rem] text-muted">{message.name} · {message.email} · {message.phone ?? "—"} · {formatDateTime(message.createdAt, locale)}</p>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted">{message.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={message.status} locale={locale} />
                  <form action={updateContactMessage} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={message.id} />
                    <Select name="status" defaultValue={message.status} className="h-8 w-28 text-xs">
                      <option value="NEW">NEW</option>
                      <option value="READ">READ</option>
                      <option value="REPLIED">REPLIED</option>
                      <option value="CLOSED">CLOSED</option>
                    </Select>
                    <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
