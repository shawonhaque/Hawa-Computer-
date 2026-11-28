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
      <img
        src="/brand/hawa-icon.png"
        alt=""
        width={320}
        height={208}
        className="h-10 w-auto shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(29,27,49,0.12)] sm:h-11"
      />
      {compact ? null : (
        <span className="leading-tight">
          <span className="block whitespace-nowrap text-[0.98rem] font-bold tracking-tight">{name}</span>
          {tagline ? <span className="hidden text-[0.68rem] font-medium text-muted sm:block">{tagline}</span> : null}
        </span>
      )}
    </Link>
  );
}
