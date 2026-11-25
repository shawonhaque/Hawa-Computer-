"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

export type SidebarItem = { href: string; label: string; icon: string };
export type SidebarGroup = { label?: string; items: SidebarItem[] };

export function DashboardSidebar({
  groups,
  brand,
  homeHref = "/",
  footer,
}: {
  groups: SidebarGroup[];
  brand: { name: string; tagline: string };
  homeHref?: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/account" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3 scrollbar-thin">
      {groups.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label ? (
            <p className="mb-1 px-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted/80">{group.label}</p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] font-medium transition",
                  isActive(item.href)
                    ? "bg-royal-soft text-royal"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon name={item.icon} size={16} />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
      {footer ? <div className="border-t border-line pt-3">{footer}</div> : null}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Logo name={brand.name} tagline={brand.tagline} href={homeHref} />
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close" />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Logo name={brand.name} tagline={brand.tagline} href={homeHref} />
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-4 py-4">
          <Logo name={brand.name} tagline={brand.tagline} href={homeHref} />
        </div>
        {nav}
      </aside>
    </>
  );
}
