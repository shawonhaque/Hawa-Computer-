"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogIn,
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
  const [searchOpen, setSearchOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
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
    <header className="sticky top-0 z-50 border-b border-[#ececf1] bg-white/95 backdrop-blur-md">
      <div className="container-page flex h-[68px] items-center gap-3 lg:h-[78px]">
        <div className="shrink-0">
          <Logo name={brand.name} tagline={brand.tagline} />
        </div>

        <nav className="hidden flex-1 items-center justify-center lg:flex" aria-label="Main">
          {nav.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "items-center whitespace-nowrap rounded-full px-2.5 py-2 text-[0.83rem] font-semibold transition-colors xl:px-3 xl:text-[0.875rem]",
                index >= 6 && "hidden xl:inline-flex",
                isActive(item.href)
                  ? "bg-royal-soft text-royal"
                  : "text-[#555] hover:bg-surface-2 hover:text-royal",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-x-1.5 lg:ml-0">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label={labels.search}
            aria-expanded={searchOpen}
            className="grid size-9 place-items-center rounded-full text-[#555] transition hover:bg-surface-2 hover:text-royal"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          <div className="hidden lg:block">
            <LocaleSwitcher locale={locale} />
          </div>

          <div className="hidden sm:block">
            <ThemeToggle labels={{ dark: labels.dark, light: labels.light }} />
          </div>

          <Link
            href="/cart"
            aria-label={labels.cart}
            title={labels.cart}
            className="relative grid size-9 place-items-center rounded-full text-[#555] transition hover:bg-surface-2 hover:text-royal"
          >
            <ShoppingCart size={18} />
            {ready && count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-royal px-1 text-[0.6rem] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[0.6rem] font-bold">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate sm:block">{user.name.split(" ")[0]}</span>
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
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                    >
                      <LogOut size={15} /> {labels.logout}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(217,119,6,0.9)] transition hover:brightness-105 sm:inline-flex lg:px-5"
            >
              <LogIn size={16} /> {labels.login}
            </Link>
          )}

          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-[#555] transition hover:bg-surface-2 hover:text-royal lg:hidden"
            aria-label={labels.menu}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-[#ececf1] bg-white">
          <div className="container-page py-3">
            <form action="/search" role="search">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  name="q"
                  autoFocus
                  placeholder={labels.searchPlaceholder}
                  aria-label={labels.search}
                  className="input pl-9"
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-10/12 max-w-xs flex-col border-r border-[#ececf1] bg-white p-5 shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo name={brand.name} tagline={brand.tagline} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.menu}
            className="grid size-9 place-items-center rounded-full hover:bg-surface-2"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2.5 text-[0.95rem] font-semibold",
                isActive(item.href) ? "bg-royal-soft text-royal" : "text-[#444] hover:bg-surface-2",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle labels={{ dark: labels.dark, light: labels.light }} />
        </div>

        <div className="mt-4 grid gap-2">
          {user ? (
            <>
              <Link href="/account" className="btn btn-secondary btn-sm justify-center">{labels.account}</Link>
              {user.isStaff ? <Link href="/admin" className="btn btn-secondary btn-sm justify-center">{labels.admin}</Link> : null}
              <form action={logout}>
                <button type="submit" className="btn btn-ghost btn-sm w-full justify-center text-danger">{labels.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary btn-sm justify-center">{labels.login}</Link>
              <Link href="/register" className="btn btn-secondary btn-sm justify-center">{labels.register}</Link>
            </>
          )}
        </div>
      </aside>
    </header>
  );
}
