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
    <div className="flex items-center gap-0.5 rounded-full border border-[#e8e8ee] bg-[#f7f7f9] px-1.5 py-1" aria-label="Language">
      <Globe size={13} className="ml-1 text-muted" aria-hidden="true" />
      {(["bn", "en"] as const).map((code) => (
        <a
          key={code}
          href={`${BASE_PATH}/api/locale?lang=${code}&next=${encodeURIComponent(current)}`}
          aria-current={locale === code ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold transition",
            locale === code ? "bg-[#8068fb] text-white shadow-sm" : "text-[#777] hover:text-[#8068fb]",
          )}
        >
          {code === "bn" ? "বাং" : "EN"}
        </a>
      ))}
    </div>
  );
}
