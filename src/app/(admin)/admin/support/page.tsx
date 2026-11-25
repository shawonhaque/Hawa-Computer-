import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { status } = await searchParams;

  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : {},
    include: { user: { select: { name: true, email: true } }, messages: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.admin.support} description={bn ? "গ্রাহকের সাপোর্ট টিকেট।" : "Customer support tickets."} />
      <form action="/admin/support" method="get" className="mb-4 flex gap-2">
        <Select name="status" defaultValue={status ?? ""} className="max-w-44">
          <option value="">{d.common.all}</option>
          <option value="OPEN">OPEN</option>
          <option value="PENDING">PENDING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </Select>
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.filter}</button>
      </form>

      {tickets.length === 0 ? (
        <EmptyState title={bn ? "কোনো টিকেট নেই" : "No tickets"} body={d.empty.body} />
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="card card-hover block p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{ticket.subject}</p>
                  <p className="text-[0.7rem] text-muted">{ticket.ticketNo} · {ticket.user.name} · {formatDateTime(ticket.updatedAt, locale)}</p>
                  {ticket.messages[0] ? <p className="mt-1 line-clamp-1 text-xs text-muted">{ticket.messages[0].body}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={ticket.priority === "HIGH" ? "danger" : "neutral"}>{ticket.priority}</Badge>
                  <StatusBadge status={ticket.status} locale={locale} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
