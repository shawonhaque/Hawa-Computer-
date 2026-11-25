import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input, Label, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { issueBook, returnBook, saveBook } from "@/actions/admin-ops";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  await requireStaff(PERMISSIONS.LIBRARY_MANAGE);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const [books, categories, issues, members] = await Promise.all([
    prisma.book.findMany({ include: { category: true }, orderBy: { titleEn: "asc" } }),
    prisma.bookCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.bookIssue.findMany({ where: { returnedAt: null }, include: { book: true, member: { include: { user: { select: { name: true } } } } }, orderBy: { dueAt: "asc" } }),
    prisma.libraryMember.findMany({ include: { user: { select: { name: true } } }, orderBy: { joinedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={d.admin.library} description={bn ? "বই, সদস্য ও ইস্যু ব্যবস্থাপনা।" : "Books, members and issue management."} />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">{bn ? "বইয়ের তালিকা" : "Book catalogue"}</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>{bn ? "বই" : "Title"}</th><th>{bn ? "লেখক" : "Author"}</th><th>{bn ? "স্টক" : "Copies"}</th></tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td className="font-medium">{bn ? book.titleBn : book.titleEn}</td>
                    <td className="text-muted">{book.author}</td>
                    <td><Badge tone={book.copiesAvailable > 0 ? "success" : "danger"}>{book.copiesAvailable}/{book.copiesTotal}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-4 rounded-xl border border-line p-3">
            <summary className="cursor-pointer text-sm font-semibold">{bn ? "নতুন বই যোগ করুন" : "Add a book"}</summary>
            <form action={saveBook} className="mt-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input name="titleBn" placeholder={bn ? "শিরোনাম (বাংলা)" : "Title (Bangla)"} required />
                <Input name="titleEn" placeholder={bn ? "শিরোনাম (ইংরেজি)" : "Title (English)"} required />
                <Input name="slug" placeholder="slug" required />
                <Input name="author" placeholder={bn ? "লেখক" : "Author"} required />
                <Select name="categoryId" required>
                  <option value="" disabled>{bn ? "ক্যাটাগরি" : "Category"}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
                </Select>
                <Input name="isbn" placeholder="ISBN" />
                <Input name="publishedYear" type="number" placeholder={bn ? "প্রকাশ সাল" : "Year"} />
                <Input name="copiesTotal" type="number" min={1} defaultValue={1} placeholder={bn ? "কপি" : "Copies"} />
                <Input name="shelf" placeholder={bn ? "শেলফ" : "Shelf"} />
                <Input name="publisher" placeholder={bn ? "প্রকাশক" : "Publisher"} />
              </div>
              <Textarea name="descriptionBn" rows={2} placeholder={bn ? "বিবরণ (বাংলা)" : "Description (Bangla)"} />
              <Textarea name="descriptionEn" rows={2} placeholder={bn ? "বিবরণ (ইংরেজি)" : "Description (English)"} />
              <SubmitButton size="sm" pendingLabel="…">{d.common.save}</SubmitButton>
            </form>
          </details>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold">{bn ? "বই ইস্যু করুন" : "Issue a book"}</h2>
            <form action={issueBook} className="space-y-2">
              <Select name="bookId" required>
                <option value="" disabled>{bn ? "বই নির্বাচন" : "Select book"}</option>
                {books.filter((book) => book.copiesAvailable > 0).map((book) => (
                  <option key={book.id} value={book.id}>{book.titleEn} ({book.copiesAvailable})</option>
                ))}
              </Select>
              <Input name="memberNo" placeholder={bn ? "সদস্য নম্বর (LIB-...)" : "Member number (LIB-...)"} required />
              <div>
                <Label htmlFor="dueAt">{bn ? "ফেরতের তারিখ" : "Due date"}</Label>
                <Input id="dueAt" name="dueAt" type="date" defaultValue={new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)} />
              </div>
              <SubmitButton size="sm" pendingLabel="…">{bn ? "ইস্যু করুন" : "Issue"}</SubmitButton>
            </form>
          </div>

          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold">{bn ? "চলমান ইস্যু" : "Open issues"}</h2>
            <ul className="space-y-2 text-sm">
              {issues.map((issue) => (
                <li key={issue.id} className="rounded-lg border border-line p-2.5">
                  <p className="font-medium">{issue.book.titleEn}</p>
                  <p className="text-[0.7rem] text-muted">{issue.member.user.name} · {bn ? "ফেরত" : "Due"}: {formatDate(issue.dueAt, locale)}</p>
                  <form action={returnBook} className="mt-1.5">
                    <input type="hidden" name="issueId" value={issue.id} />
                    <SubmitButton variant="secondary" size="sm" pendingLabel="…">{bn ? "ফেরত নিন" : "Mark returned"}</SubmitButton>
                  </form>
                </li>
              ))}
              {issues.length === 0 ? <li className="text-xs text-muted">{bn ? "কোনো ইস্যু নেই।" : "No open issues."}</li> : null}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold">{bn ? "সদস্য" : "Members"} ({members.length})</h2>
            <ul className="space-y-1.5 text-sm">
              {members.slice(0, 10).map((member) => (
                <li key={member.id} className="flex justify-between gap-2 text-xs">
                  <span className="truncate text-muted">{member.user.name}</span>
                  <span className="shrink-0 font-mono">{member.memberNo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
