import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes = [
    "", "/services", "/applications", "/shop", "/library", "/training", "/tools", "/tools/photo",
    "/tools/pdf", "/tools/image", "/tools/signature", "/about", "/contact", "/faq",
    "/track", "/verify", "/p/privacy-policy", "/p/terms", "/p/refund-policy",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [services, products, books, courses] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, select: { slug: true, kind: true, updatedAt: true } }),
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.book.findMany({ select: { slug: true } }),
    prisma.course.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    ...staticRoutes,
    ...services.map((service) => ({
      url: `${base}${service.kind === "APPLICATION" ? "/applications" : "/services"}/${service.slug}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/shop/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...books.map((book) => ({
      url: `${base}/library/${book.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...courses.map((course) => ({
      url: `${base}/training/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
