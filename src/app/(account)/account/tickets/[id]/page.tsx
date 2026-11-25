import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { replyToTicket } from "@/actions/account";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/tickets/${id}`);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: { messages: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/account/tickets" className="text-xs text-muted hover:text-royal">← {d.account.tickets}</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{ticket.subject}</h2>
            <p className="text-xs text-muted">{ticket.ticketNo} · {formatDateTime(ticket.createdAt, locale)}</p>
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

      {ticket.status !== "CLOSED" ? (
        <form action={replyToTicket} className="card space-y-2 p-4">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <label htmlFor="body" className="label">{bn ? "উত্তর দিন" : "Reply"}</label>
          <Textarea id="body" name="body" rows={3} required />
          <SubmitButton pendingLabel={d.common.loading}>{bn ? "পাঠান" : "Send"}</SubmitButton>
        </form>
      ) : (
        <p className="rounded-xl border border-line bg-surface-2 p-3 text-center text-xs text-muted">
          {bn ? "এই টিকেটটি বন্ধ করা হয়েছে। নতুন টিকেট খুলুন।" : "This ticket is closed. Please open a new ticket."}
        </p>
      )}
    </div>
  );
}
