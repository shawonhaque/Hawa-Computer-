import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { createTicket } from "@/actions/account";

export const dynamic = "force-dynamic";

export default async function AccountTicketsPage() {
  const user = await requireUser("/account/tickets");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={d.account.tickets} description={bn ? "সমস্যা বা প্রশ্নের জন্য টিকেট খুলুন — আমরা দ্রুত উত্তর দিই।" : "Open a ticket for any issue or question — we reply quickly."} />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {tickets.length === 0 ? (
            <EmptyState icon={<LifeBuoy size={22} />} title={bn ? "কোনো টিকেট নেই" : "No tickets yet"} body={d.empty.body} />
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/account/tickets/${ticket.id}`} className="card card-hover block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{ticket.subject}</p>
                      <p className="text-[0.7rem] text-muted">{ticket.ticketNo} · {formatDateTime(ticket.updatedAt, locale)}</p>
                      {ticket.messages[0] ? <p className="mt-1 line-clamp-1 text-xs text-muted">{ticket.messages[0].body}</p> : null}
                    </div>
                    <StatusBadge status={ticket.status} locale={locale} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <form action={createTicket} className="card h-fit space-y-3 p-4">
          <h2 className="text-sm font-semibold">{bn ? "নতুন টিকেট" : "New ticket"}</h2>
          <div>
            <Label htmlFor="subject" required>{bn ? "বিষয়" : "Subject"}</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div>
            <Label htmlFor="priority">{bn ? "গুরুত্ব" : "Priority"}</Label>
            <Select id="priority" name="priority" defaultValue="NORMAL">
              <option value="LOW">{bn ? "কম" : "Low"}</option>
              <option value="NORMAL">{bn ? "স্বাভাবিক" : "Normal"}</option>
              <option value="HIGH">{bn ? "উচ্চ" : "High"}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="message" required>{bn ? "বিস্তারিত" : "Details"}</Label>
            <Textarea id="message" name="message" rows={4} required />
          </div>
          <SubmitButton className="w-full" pendingLabel={d.common.loading}>{d.common.submit}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
