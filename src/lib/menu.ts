import "server-only";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/dictionaries";

export type MenuLink = { href: string; label: string; hint?: string };
export type MenuColumn = { href: string; label: string; allLabel: string; links: MenuLink[] };
export type MenuGroup = { href: string; label: string; columns?: MenuColumn[] };
export type SearchEntry = { href: string; label: string; kind: string };

const BOOK_CATEGORIES = ["childrens-books", "educational-books"];

export async function getMenu(locale: Locale): Promise<{ groups: MenuGroup[]; search: SearchEntry[] }> {
  const bn = locale === "bn";
  const [applications, services, courses, categories, products] = await Promise.all([
    prisma.service.findMany({
      where: { kind: "APPLICATION", active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameBn: true, nameEn: true },
    }),
    prisma.service.findMany({
      where: { kind: { in: ["PHOTO", "DOCUMENT", "PRINTING", "OTHER"] }, active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      select: { slug: true, nameBn: true, nameEn: true },
    }),
    prisma.course.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { slug: true, titleBn: true, titleEn: true },
    }),
    prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameBn: true, nameEn: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: { slug: true, nameBn: true, nameEn: true },
    }),
  ]);

  const name = (row: { nameBn: string; nameEn: string }) => (bn ? row.nameBn : row.nameEn);
  const course = (row: { titleBn: string; titleEn: string }) => (bn ? row.titleBn : row.titleEn);

  const stationery = categories.filter((c) => !BOOK_CATEGORIES.includes(c.slug));
  const books = categories.filter((c) => BOOK_CATEGORIES.includes(c.slug));

  const groups: MenuGroup[] = [
    { href: "/", label: bn ? "হোম" : "Home" },
    {
      href: "/services",
      label: bn ? "সেবাসমূহ" : "Services",
      columns: [
        {
          href: "/applications",
          label: bn ? "অনলাইন আবেদন" : "Online applications",
          allLabel: bn ? "সব আবেদন দেখুন" : "All applications",
          links: applications.slice(0, 7).map((s) => ({ href: `/applications/${s.slug}`, label: name(s) })),
        },
        {
          href: "/tools",
          label: bn ? "টুলস ও প্যাকেজ" : "Tools & packages",
          allLabel: bn ? "সব সেবা ও টুলস" : "All services & tools",
          links: services.slice(0, 7).map((s) => ({ href: `/services/${s.slug}`, label: name(s) })),
        },
        {
          href: "/training",
          label: bn ? "কম্পিউটার প্রশিক্ষণ" : "Computer training",
          allLabel: bn ? "সব কোর্স" : "All courses",
          links: courses.slice(0, 7).map((c) => ({ href: `/training/${c.slug}`, label: course(c) })),
        },
      ],
    },
    {
      href: "/shop",
      label: bn ? "শপ" : "Shop",
      columns: [
        {
          href: "/shop",
          label: bn ? "স্টেশনারি শপ" : "Stationery shop",
          allLabel: bn ? "সব পণ্য" : "All products",
          links: stationery.slice(0, 7).map((c) => ({ href: `/shop?category=${c.slug}`, label: name(c) })),
        },
        {
          href: "/library",
          label: bn ? "বই ও লাইব্রেরি" : "Books & library",
          allLabel: bn ? "লাইব্রেরি দেখুন" : "Browse the library",
          links: [
            ...books.map((c) => ({ href: `/shop?category=${c.slug}`, label: name(c) })),
            { href: "/library", label: bn ? "লাইব্রেরি সদস্যপদ" : "Library membership" },
            { href: "/shop?sort=price_asc", label: bn ? "কম দামে পণ্য" : "Lowest price first" },
          ],
        },
      ],
    },
    { href: "/about", label: bn ? "আমাদের সম্পর্কে" : "About us" },
    { href: "/contact", label: bn ? "যোগাযোগ" : "Contact" },
  ];

  // The search box filters this list in the browser, so it ships with every page.
  const search: SearchEntry[] = [
    ...applications.map((s) => ({ href: `/applications/${s.slug}`, label: name(s), kind: bn ? "আবেদন" : "Application" })),
    ...services.map((s) => ({ href: `/services/${s.slug}`, label: name(s), kind: bn ? "সেবা" : "Service" })),
    ...courses.map((c) => ({ href: `/training/${c.slug}`, label: course(c), kind: bn ? "কোর্স" : "Course" })),
    ...products.map((p) => ({ href: `/shop/${p.slug}`, label: name(p), kind: bn ? "পণ্য" : "Product" })),
    ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: name(c), kind: bn ? "ক্যাটাগরি" : "Category" })),
    { href: "/tools/photo", label: bn ? "ফটো এডিটর" : "Photo editor", kind: bn ? "টুল" : "Tool" },
    { href: "/tools", label: bn ? "৮০+ ফ্রি টুলস" : "80+ free tools", kind: bn ? "টুল" : "Tool" },
    { href: "/track", label: bn ? "অর্ডার ট্র্যাক" : "Order tracking", kind: bn ? "সহায়তা" : "Help" },
    { href: "/faq", label: bn ? "সাধারণ প্রশ্ন" : "FAQ", kind: bn ? "সহায়তা" : "Help" },
  ];

  return { groups, search };
}
