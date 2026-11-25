import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { adminReplyTicket, updateTicketStatus } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, phone: true } }, messages: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/admin/support" className="text-xs text-muted hover:text-royal">← {d.admin.support}</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{ticket.subject}</h2>
            <p className="text-xs text-muted">{ticket.ticketNo} · {ticket.user.name} · {ticket.user.email} · {ticket.user.phone ?? "—"}</p>
          </div>
          <StatusBadge status={ticket.status} locale={locale} />
        </div>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((message) => (
          <div key={message.id} className={`card p-4 ${message.isStaff ? "border-royal/30 bg-royal/5" : ""}`}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              {message.isStaff ? <ShieldCheck size={14} className="text-royal" /> : <User size={14} className="text-muted" />}
              <span>{message.isStaff ? (bn ? "সাপোর্ট টিম" : "Support team") : message.author.name}</span>
              <span className="font-normal text-muted">· {formatDateTime(message.createdAt, locale)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{message.body}</p>
          </div>
        ))}
      </div>

      <form action={adminReplyTicket} className="card space-y-2 p-4">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <label htmlFor="body" className="label">{bn ? "উত্তর দিন" : "Reply"}</label>
        <Textarea id="body" name="body" rows={3} required />
        <SubmitButton pendingLabel="…">{bn ? "পাঠান" : "Send"}</SubmitButton>
      </form>

      <form action={updateTicketStatus} className="card flex flex-wrap items-end gap-2 p-4">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <div className="flex-1">
          <label htmlFor="status" className="label">{d.common.status}</label>
          <Select id="status" name="status" defaultValue={ticket.status}>
            <option value="OPEN">OPEN</option>
            <option value="PENDING">PENDING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </Select>
        </div>
        <SubmitButton variant="secondary" pendingLabel="…">{d.common.update}</SubmitButton>
      </form>
    </div>
  );
}
