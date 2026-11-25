"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import type { Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const current = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || "/" : pathname;

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5" aria-label="Language">
      <Globe size={14} className="ml-1.5 text-muted" aria-hidden="true" />
      {(["bn", "en"] as const).map((code) => (
        <a
          key={code}
          href={`${BASE_PATH}/api/locale?lang=${code}&next=${encodeURIComponent(current)}`}
          aria-current={locale === code ? "true" : undefined}
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold transition",
            locale === code ? "bg-royal text-white" : "text-muted hover:text-fg",
          )}
        >
          {code === "bn" ? "বাংলা" : "EN"}
        </a>
      ))}
    </div>
  );
}
