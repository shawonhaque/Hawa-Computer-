import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Library } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { requestBookBorrow } from "@/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const book = await prisma.book.findUnique({ where: { slug } });
  if (!book) return { title: "Book" };
  return { title: pick<string>(book as never, "title", locale), description: pick<string>(book as never, "description", locale) };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();

  const book = await prisma.book.findUnique({ where: { slug }, include: { category: true } });
  if (!book) notFound();

  const member = user ? await prisma.libraryMember.findUnique({ where: { userId: user.id } }) : null;
  const title = pick<string>(book as never, "title", locale);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: d.nav.home, href: "/" },
          { label: d.nav.library, href: "/library" },
          { label: title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#1d4ed8] text-white/80">
          <BookOpen size={64} />
        </div>

        <div>
          <Badge tone="cyan">{pick<string>(book.category as never, "name", locale)}</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{book.author}</p>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">ISBN</dt>
              <dd className="font-medium">{book.isbn ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "প্রকাশ সাল" : "Published"}</dt>
              <dd className="font-medium">{book.publishedYear ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "মোট কপি" : "Total copies"}</dt>
              <dd className="font-medium">{book.copiesTotal}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-xs text-muted">{bn ? "বর্তমানে আছে" : "Available"}</dt>
              <dd className="font-medium">{book.copiesAvailable}</dd>
            </div>
          </dl>

          <p className="mt-5 text-sm leading-relaxed text-muted">{pick<string>(book as never, "description", locale)}</p>

          <div className="mt-6">
            {book.copiesAvailable > 0 ? <Badge tone="success">{bn ? "স্টকে আছে" : "Available"}</Badge> : <Badge tone="danger">{bn ? "বর্তমানে নেই" : "Not available"}</Badge>}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-surface p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Library size={15} /> {bn ? "বই ধার নেওয়ার অনুরোধ" : "Request to borrow"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {bn
                ? "সদস্যপদ থাকলে অনুরোধ করুন; লাইব্রেরি ম্যানেজার অনুমোদনের পর সংগ্রহ করতে পারবেন।"
                : "Members can request this book; collect it once the library manager approves."}
            </p>
            <div className="mt-3">
              {!user ? (
                <Link href={`/login?next=/library/${book.slug}`} className="btn btn-secondary btn-sm">{d.common.login}</Link>
              ) : !member ? (
                <Link href="/library" className="btn btn-secondary btn-sm">{bn ? "আগে সদস্যপদ নিন" : "Join the library first"}</Link>
              ) : (
                <form action={requestBookBorrow}>
                  <input type="hidden" name="bookId" value={book.id} />
                  <SubmitButton size="sm" pendingLabel={d.common.loading} disabled={book.copiesAvailable <= 0}>
                    {bn ? "অনুরোধ পাঠান" : "Send request"}
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
