import Link from "next/link";
import {
  ArrowRight,
  Backpack,
  BookOpen,
  Clock,
  Droplets,
  Eraser,
  MapPin,
  NotebookPen,
  Package,
  PenTool,
  Scissors,
  Star,
} from "lucide-react";
import { AddToCart } from "@/components/ui/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatTaka } from "@/lib/utils";
import { pick, type Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

type Bilingual = Record<string, unknown>;

export function ServiceCard({
  service,
  locale,
  orderLabel,
  fromLabel,
  featuredLabel,
}: {
  service: Bilingual & { slug: string; price: number; icon?: string; kind?: string; featured?: boolean; processingTimeBn?: string; processingTimeEn?: string };
  locale: Locale;
  orderLabel: string;
  fromLabel: string;
  featuredLabel?: string;
}) {
  const href = service.kind === "APPLICATION" ? `/applications/${service.slug}` : `/services/${service.slug}`;
  return (
    <Link href={href} className="card card-hover group flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-royal/12 to-cyan/10 text-royal">
          <Icon name={service.icon ?? "Sparkles"} size={20} />
        </span>
        {service.featured && featuredLabel ? <Badge tone="cyan">{featuredLabel}</Badge> : null}
      </div>
      <h3 className="text-base font-semibold leading-snug group-hover:text-royal">
        {pick<string>(service, "name", locale)}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
        {pick<string>(service, "summary", locale)}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-wide text-muted">{fromLabel}</p>
          <p className="text-lg font-bold text-royal">{formatTaka(service.price, locale)}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-royal">
          {orderLabel} <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}


const thumbThemes: { match: RegExp; Icon: typeof Package; tint: string }[] = [
  { match: /notebook|khata|diary|copy|paper|chart|hardboard/i, Icon: NotebookPen, tint: "from-[#f59e0b]/18 via-[#fde68a]/10 to-transparent" },
  { match: /pen|marker|pencil|sharpener/i, Icon: PenTool, tint: "from-[#8068fb]/18 via-[#c4b5fd]/10 to-transparent" },
  { match: /eraser/i, Icon: Eraser, tint: "from-[#38bdf8]/18 via-[#bae6fd]/10 to-transparent" },
  { match: /scissors|stapler|folder|file/i, Icon: Scissors, tint: "from-[#0ea5e9]/16 via-[#e0f2fe]/10 to-transparent" },
  { match: /bag/i, Icon: Backpack, tint: "from-[#22c55e]/16 via-[#dcfce7]/10 to-transparent" },
  { match: /bottle|water/i, Icon: Droplets, tint: "from-[#06b6d4]/16 via-[#cffafe]/10 to-transparent" },
  { match: /book/i, Icon: BookOpen, tint: "from-[#f97316]/16 via-[#ffedd5]/10 to-transparent" },
];

function productTheme(slug: string) {
  return thumbThemes.find((theme) => theme.match.test(slug)) ?? { Icon: Package, tint: "from-royal/16 via-transparent to-cyan/10" };
}

export function ProductCard({
  product,
  locale,
  addLabel,
  addedLabel,
  outOfStock,
  inStockLabel,
}: {
  product: {
    id: string; slug: string; price: number; comparePrice?: number | null; stock: number;
    nameBn: string; nameEn: string; images?: unknown; sku?: string;
  };
  locale: Locale;
  addLabel: string;
  addedLabel: string;
  outOfStock: string;
  inStockLabel: string;
}) {
  const name = pick<string>(product as unknown as Bilingual, "name", locale);
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const image = images[0];

  return (
    <div className="card card-hover group flex h-full flex-col overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <span className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br", productTheme(product.slug).tint)}>
            <span aria-hidden="true" className="absolute -right-6 -top-8 size-24 rounded-full bg-white/40 blur-xl" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 bg-[repeating-linear-gradient(45deg,rgba(29,27,49,0.05)_0_2px,transparent_2px_9px)]" />
            {(() => {
              const ThumbIcon = productTheme(product.slug).Icon;
              return (
                <ThumbIcon
                  size={44}
                  strokeWidth={1.4}
                  className="relative text-royal/70 transition duration-300 group-hover:scale-110"
                />
              );
            })()}
          </span>
        )}
        {product.stock <= 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[0.65rem] font-semibold text-white">{outOfStock}</span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/shop/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-royal">
          {name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-royal">{formatTaka(product.price, locale)}</span>
          {product.comparePrice && product.comparePrice > product.price ? (
            <span className="text-xs text-muted line-through">{formatTaka(product.comparePrice, locale)}</span>
          ) : null}
        </div>
        <p className="mt-1 text-[0.7rem] text-muted">
          {product.stock > 0 ? `${inStockLabel}: ${product.stock}` : outOfStock}
        </p>
        <div className="mt-auto pt-3">
          <AddToCart
            product={{ productId: product.id, slug: product.slug, name, price: product.price, image: image ?? null, stock: product.stock, sku: product.sku }}
            label={addLabel}
            addedLabel={addedLabel}
            outOfStockLabel={outOfStock}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export function CourseCard({
  course,
  locale,
  enrollLabel,
  weeksLabel,
}: {
  course: { slug: string; fee: number; durationWeeks: number; level: string; titleBn: string; titleEn: string; summaryBn: string; summaryEn: string; coverUrl?: string | null };
  locale: Locale;
  enrollLabel: string;
  weeksLabel: string;
}) {
  return (
    <Link href={`/training/${course.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#1d3b62] to-[#0e7490]">
        {course.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" loading="lazy" />
        ) : (
          <>
            <span aria-hidden="true" className="absolute -left-10 top-4 size-28 rounded-full bg-[#f59e0b]/25 blur-2xl" />
            <span aria-hidden="true" className="absolute -bottom-8 right-2 size-24 rounded-full bg-cyan-400/25 blur-2xl" />
            <span aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(120deg,rgba(255,255,255,0.07)_0_1px,transparent_1px_14px)]" />
            <Icon name="Laptop" size={36} className="relative text-white/85" />
          </>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem] font-semibold text-white backdrop-blur">
          {course.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug group-hover:text-royal">
          {pick<string>(course as unknown as Bilingual, "title", locale)}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
          {pick<string>(course as unknown as Bilingual, "summary", locale)}
        </p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-base font-bold text-royal">{formatTaka(course.fee, locale)}</p>
            <p className="text-[0.68rem] text-muted">{course.durationWeeks} {weeksLabel}</p>
          </div>
          <span className="text-xs font-semibold text-royal">{enrollLabel} →</span>
        </div>
      </div>
    </Link>
  );
}

export function BookCard({
  book,
  locale,
  availableLabel,
  unavailableLabel,
}: {
  book: { slug: string; titleBn: string; titleEn: string; author: string; copiesAvailable: number; isbn?: string | null; publishedYear?: number | null };
  locale: Locale;
  availableLabel: string;
  unavailableLabel: string;
}) {
  return (
    <Link href={`/library/${book.slug}`} className="card card-hover group flex gap-3 p-3">
      <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy to-[#1d4ed8] text-white/85">
        <Icon name="BookOpen" size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-royal">
          {pick<string>(book as unknown as Bilingual, "title", locale)}
        </h3>
        <p className="mt-1 truncate text-xs text-muted">{book.author}</p>
        {book.publishedYear ? (
          <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] text-muted">
            <Clock size={11} /> {book.publishedYear}
          </p>
        ) : null}
        <p className="mt-1.5">
          {book.copiesAvailable > 0 ? (
            <Badge tone="success">{availableLabel}</Badge>
          ) : (
            <Badge tone="danger">{unavailableLabel}</Badge>
          )}
        </p>
      </div>
    </Link>
  );
}

export function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: { name: string; rating: number; messageBn: string; messageEn: string; roleBn?: string | null; roleEn?: string | null };
  locale: Locale;
}) {
  return (
    <figure className="card flex h-full flex-col p-5">
      <div className="mb-3 flex items-center gap-0.5 text-warning">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} fill={i < testimonial.rating ? "currentColor" : "none"} strokeWidth={1.5} />
        ))}
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed text-muted">
        “{pick<string>(testimonial as unknown as Bilingual, "message", locale)}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5 border-t border-line pt-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-royal-soft text-xs font-bold text-royal">
          {testimonial.name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold">{testimonial.name}</p>
          {testimonial.roleBn || testimonial.roleEn ? (
            <p className="text-[0.7rem] text-muted">{pick<string>(testimonial as unknown as Bilingual, "role", locale)}</p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

export function ContactLine({ icon, children }: { icon: "pin" | "clock"; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted">
      {icon === "pin" ? <MapPin size={15} className="mt-0.5 shrink-0" /> : <Clock size={15} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

export function DateLine({ date, locale }: { date: Date | string; locale: Locale }) {
  return <span className="text-xs text-muted">{formatDate(date, locale)}</span>;
}
