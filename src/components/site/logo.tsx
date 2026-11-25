import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  name,
  tagline,
  href = "/",
  compact = false,
  className,
}: {
  name: string;
  tagline?: string;
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)} aria-label={name}>
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#142B4A] via-[#1d4ed8] to-[#06B6D4] text-white shadow-md">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="18" cy="7" r="2.4" fill="#22d3ee" />
        </svg>
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-[0.98rem] font-bold tracking-tight">{name}</span>
          {tagline ? <span className="block text-[0.68rem] font-medium text-muted">{tagline}</span> : null}
        </span>
      )}
    </Link>
  );
}
