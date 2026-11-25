import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Library, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { BookCard } from "@/components/site/cards";
import { EmptyState } from "@/components/ui/primitives";
import { requestLibraryMembership } from "@/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "বই ও লাইব্রেরি" : "Books & Library",
    description:
      locale === "bn"
        ? "লাইব্রেরির বইয়ের ক্যাটালগ, সদস্যপদ ও বই ধার নেওয়ার সেবা।"
        : "Library catalogue, membership and book borrowing service.",
  };
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const user = await getSessionUser();
  const { category, q } = await searchParams;

  const [categories, books, member] = await Promise.all([
    prisma.bookCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.book.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { titleBn: { contains: q, mode: "insensitive" } },
                { titleEn: { contains: q, mode: "insensitive" } },
                { author: { contains: q, mode: "insensitive" } },
                { isbn: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    user ? prisma.libraryMember.findUnique({ where: { userId: user.id } }) : null,
  ]);

  return (
    <>
      <PageHero
        eyebrow={bn ? "লাইব্রেরি" : "Library"}
        title={bn ? "বই ও লাইব্রেরি সেবা" : "Books & library service"}
        description={
          bn
            ? "অনলাইনে বইয়ের ক্যাটালগ দেখুন, সদস্যপদ নিন এবং বই ধার নেওয়ার অনুরোধ করুন।"
            : "Browse the catalogue online, join as a member and request books to borrow."
        }
      >
        <form action="/library" method="get" className="mt-6 flex max-w-lg gap-2" role="search">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q ?? ""} placeholder={bn ? "বই, লেখক বা ISBN খুঁজুন" : "Search book, author or ISBN"} className="input pl-9" aria-label={d.common.search} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">{d.common.search}</button>
        </form>
      </PageHero>

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.library }]} />

        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Link href="/library" className={cn("badge", !category ? "badge-info" : "badge-neutral")}>{d.common.all}</Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/library?category=${item.slug}`}
                className={cn("badge", category === item.slug ? "badge-info" : "badge-neutral")}
              >
                {pick<string>(item as never, "name", locale)}
              </Link>
            ))}
          </div>

          {user ? (
            member ? (
              <div className="rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs font-medium text-success">
                <Library size={13} className="mr-1 inline" />
                {bn ? "সদস্য" : "Member"} · {member.memberNo}
              </div>
            ) : (
              <form action={requestLibraryMembership}>
                <SubmitButton variant="secondary" size="sm" pendingLabel={d.common.loading}>
                  <Library size={14} /> {bn ? "সদস্যপদ নিন" : "Join library"}
                </SubmitButton>
              </form>
            )
          ) : (
            <Link href="/login?next=/library" className="btn btn-secondary btn-sm">{bn ? "সদস্যপদ নিতে লগইন" : "Log in to join"}</Link>
          )}
        </div>

        {books.length === 0 ? (
          <EmptyState icon={<BookOpen size={22} />} title={d.common.noResults} body={d.empty.body} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book as never}
                locale={locale}
                availableLabel={bn ? "স্টকে আছে" : "Available"}
                unavailableLabel={bn ? "বর্তমানে নেই" : "Not available"}
              />
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { title: bn ? "সদস্যপদ" : "Membership", body: bn ? "অ্যাকাউন্ট খুলে লাইব্রেরি সদস্যপদ নিন — বার্ষিক সদস্যপদের মেয়াদ এক বছর।" : "Open an account and join — annual membership lasts one year." },
            { title: bn ? "বই ধার" : "Borrowing", body: bn ? "সদস্যরা অনলাইনে অনুরোধ করতে পারেন; লাইব্রেরি ম্যানেজার অনুমোদন করেন।" : "Members can request online; the library manager approves each request." },
            { title: bn ? "ফি ও জরিমানা" : "Fees & fines", body: bn ? "দেরিতে ফেরত দিলে প্রতিদিন ৫৳ জরিমানা প্রযোজ্য।" : "Late returns incur a 5৳ per day fine." },
          ].map((card) => (
            <div key={card.title} className="card p-4">
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
