import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href ? (
              <Link href={item.href} className="hover:text-royal">{item.label}</Link>
            ) : (
              <span className="text-fg">{item.label}</span>
            )}
            {index < items.length - 1 ? <ChevronRight size={12} className="text-line-strong" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container-page relative z-10 py-10 sm:py-14">
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-royal">{eyebrow}</p> : null}
        <h1 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
        {children}
      </div>
    </section>
  );
}
