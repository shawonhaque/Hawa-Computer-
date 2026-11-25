import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { statusLabel, type Locale } from "@/lib/dictionaries";
import { toneFor, type Tone } from "@/lib/status";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function StatusBadge({ status, locale = "bn" }: { status: string; locale?: Locale }) {
  return <Badge tone={toneFor(status)}>{statusLabel(locale, status)}</Badge>;
}
