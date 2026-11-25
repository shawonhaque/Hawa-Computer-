import Link from "next/link";
import { BookOpen, Library } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate, formatTaka } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { requestLibraryMembership } from "@/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function AccountLibraryPage() {
  const user = await requireUser("/account/library");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const member = await prisma.libraryMember.findUnique({
    where: { userId: user.id },
    include: { issues: { include: { book: true }, orderBy: { issuedAt: "desc" } } },
  });

  return (
    <div>
      <PageHeader title={d.account.library} description={bn ? "সদস্যপদ, ধার করা বই ও জরিমানা।" : "Membership, borrowed books and fines."} />
      {!member ? (
        <div className="card p-6 text-center">
          <Library size={26} className="mx-auto text-royal" />
          <p className="mt-3 text-sm font-semibold">{bn ? "আপনি এখনো লাইব্রেরি সদস্য নন" : "You are not a library member yet"}</p>
          <p className="mt-1 text-xs text-muted">{bn ? "সদস্যপদ নিলে বই ধার নেওয়ার অনুরোধ করতে পারবেন।" : "Join to request books to borrow."}</p>
          <form action={requestLibraryMembership} className="mt-4">
            <SubmitButton pendingLabel={d.common.loading}>{bn ? "সদস্যপদ নিন" : "Join library"}</SubmitButton>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs text-muted">{bn ? "সদস্য নম্বর" : "Member number"}</p>
              <p className="text-lg font-bold tracking-wide">{member.memberNo}</p>
              <p className="text-xs text-muted">
                {bn ? "যোগদান" : "Joined"}: {formatDate(member.joinedAt, locale)}
                {member.expiresAt ? ` · ${bn ? "মেয়াদ" : "Expires"}: ${formatDate(member.expiresAt, locale)}` : ""}
              </p>
            </div>
            <Badge tone={member.status === "ACTIVE" ? "success" : "danger"}>{member.status}</Badge>
          </div>

          {member.issues.length === 0 ? (
            <EmptyState icon={<BookOpen size={22} />} title={bn ? "কোনো বই ধার নেননি" : "No books borrowed"} action={<Link href="/library" className="btn btn-primary btn-sm">{d.nav.library}</Link>} />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>{bn ? "বই" : "Book"}</th>
                    <th>{bn ? "ইস্যু" : "Issued"}</th>
                    <th>{bn ? "ফেরতের তারিখ" : "Due"}</th>
                    <th>{bn ? "ফেরত" : "Returned"}</th>
                    <th>{bn ? "জরিমানা" : "Fine"}</th>
                    <th>{d.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {member.issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="font-medium">{bn ? issue.book.titleBn : issue.book.titleEn}</td>
                      <td className="text-muted">{formatDate(issue.issuedAt, locale)}</td>
                      <td className="text-muted">{formatDate(issue.dueAt, locale)}</td>
                      <td className="text-muted">{issue.returnedAt ? formatDate(issue.returnedAt, locale) : "—"}</td>
                      <td>{issue.fine > 0 ? formatTaka(issue.fine, locale) : "—"}</td>
                      <td><StatusBadge status={issue.returnedAt ? "RETURNED" : "ISSUED"} locale={locale} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
