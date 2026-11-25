"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/lib/cart";
import { logout } from "@/actions/auth";
import type { Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

export function Header({
  locale,
  nav,
  user,
  brand,
  labels,
}: {
  locale: Locale;
  nav: NavItem[];
  user: { name: string; isStaff: boolean } | null;
  brand: { name: string; tagline: string };
  labels: {
    login: string;
    register: string;
    account: string;
    admin: string;
    logout: string;
    cart: string;
    search: string;
    searchPlaceholder: string;
    menu: string;
    language: string;
    theme: string;
    dark: string;
    light: string;
  };
}) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line/70 transition-all",
        scrolled ? "glass shadow-sm" : "bg-surface/90 backdrop-blur",
      )}
    >
      <div className="container-page flex h-16 items-center gap-3">
        <Logo name={brand.name} tagline={brand.tagline} />

        <nav className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-colors",
                isActive(item.href)
                  ? "bg-royal-soft text-royal"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/search" className="ml-auto hidden items-center md:flex" role="search">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              placeholder={labels.searchPlaceholder}
              aria-label={labels.search}
              className="input h-9 w-44 pl-8 text-[0.82rem] xl:w-60"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle labels={{ dark: labels.dark, light: labels.light }} />
          </div>

          <Link
            href="/cart"
            className="btn btn-ghost btn-icon relative"
            aria-label={labels.cart}
            title={labels.cart}
          >
            <ShoppingCart size={18} />
            {ready && count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-royal px-1 text-[0.6rem] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="relative hidden sm:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                className="btn btn-secondary btn-sm gap-1.5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-royal text-[0.6rem] font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-24 truncate">{user.name.split(" ")[0]}</span>
                <ChevronDown size={13} />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                  <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                    <User size={15} /> {labels.account}
                  </Link>
                  {user.isStaff ? (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                      <LayoutDashboard size={15} /> {labels.admin}
                    </Link>
                  ) : null}
                  <form action={logout}>
                    <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10">
                      <LogOut size={15} /> {labels.logout}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link href="/login" className="btn btn-ghost btn-sm">{labels.login}</Link>
              <Link href="/register" className="btn btn-primary btn-sm">{labels.register}</Link>
            </div>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-icon lg:hidden"
            aria-label={labels.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface lg:hidden">
          <div className="container-page py-4">
            <form action="/search" role="search" className="mb-4">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="search" name="q" placeholder={labels.searchPlaceholder} className="input pl-9" />
              </div>
            </form>
            <nav className="grid gap-1" aria-label="Mobile">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(item.href) ? "bg-royal-soft text-royal" : "text-fg hover:bg-surface-2",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
              <LocaleSwitcher locale={locale} />
              <ThemeToggle labels={{ dark: labels.dark, light: labels.light }} />
            </div>
            <div className="mt-3 grid gap-2">
              {user ? (
                <>
                  <Link href="/account" className="btn btn-secondary btn-sm">{labels.account}</Link>
                  {user.isStaff ? <Link href="/admin" className="btn btn-secondary btn-sm">{labels.admin}</Link> : null}
                  <form action={logout}>
                    <button type="submit" className="btn btn-ghost btn-sm w-full text-danger">{labels.logout}</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary btn-sm">{labels.login}</Link>
                  <Link href="/register" className="btn btn-primary btn-sm">{labels.register}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
