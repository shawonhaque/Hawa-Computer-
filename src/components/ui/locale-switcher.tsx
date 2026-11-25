"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocale } from "@/actions/locale";
import type { Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5" aria-label="Language">
      <Globe size={14} className="ml-1.5 text-muted" aria-hidden="true" />
      {(["bn", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => change(code)}
          aria-pressed={locale === code}
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold transition",
            locale === code ? "bg-royal text-white" : "text-muted hover:text-fg",
          )}
        >
          {code === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}
