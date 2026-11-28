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
import { logoutUser, useLocalSession } from "@/lib/local-auth";
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
  const { session } = useLocalSession();
  const activeUser = user ?? (session ? { name: session.name, isStaff: false } : null);
  const accountHref = user ? "/account" : "/my-account";
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

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

  function movePillTo(element: HTMLElement | null) {
    const nav = navRef.current;
    if (!nav || !element) {
      setPill((current) => ({ ...current, visible: false }));
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    setPill({ left: box.left - navBox.left, width: box.width, visible: true });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    movePillTo(navRef.current?.querySelector<HTMLElement>('[data-active="true"]') ?? null);
    const onResize = () =>
      movePillTo(navRef.current?.querySelector<HTMLElement>('[data-active="true"]') ?? null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-white/60 bg-white/70 shadow-[0_10px_30px_-18px_rgba(29,27,49,0.45)] backdrop-blur-xl backdrop-saturate-150"
          : "border-[#ececf1] bg-white/95 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "container-page grid grid-cols-[auto_1fr_auto] items-center gap-x-2 transition-[padding] duration-300",
          scrolled ? "py-1.5 lg:py-2" : "py-2 lg:py-3",
        )}
      >
        <div className="col-start-1 row-start-1 shrink-0">
          <Logo name={brand.name} tagline={brand.tagline} />
        </div>

        <nav
          ref={navRef}
          onMouseLeave={() =>
            movePillTo(navRef.current?.querySelector<HTMLElement>('[data-active="true"]') ?? null)
          }
          className="relative col-span-3 row-start-2 hidden min-w-0 items-center justify-center gap-x-0.5 lg:flex lg:border-t lg:border-[#ececf1]/70 lg:pb-0.5 lg:pt-1.5"
          aria-label="Main"
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-1 left-0 rounded-full bg-royal-soft/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm transition-all duration-300 ease-out",
              pill.visible ? "opacity-100" : "opacity-0",
            )}
            style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
          />
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) ? "true" : "false"}
              onMouseEnter={(event) => movePillTo(event.currentTarget)}
              onFocus={(event) => movePillTo(event.currentTarget)}
              className={cn(
                "relative z-10 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.8rem] font-semibold transition-colors duration-200 xl:px-3 xl:text-[0.84rem]",
                isActive(item.href) ? "text-royal" : "text-[#555] hover:text-royal",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-x-1 justify-self-end">
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

          {activeUser ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[0.6rem] font-bold">
                  {activeUser.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate sm:block">{activeUser.name.split(" ")[0]}</span>
                <ChevronDown size={13} />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                  <Link href={accountHref} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                    <User size={15} /> {labels.account}
                  </Link>
                  {activeUser.isStaff ? (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                      <LayoutDashboard size={15} /> {labels.admin}
                    </Link>
                  ) : null}
                  {user ? (
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                      >
                        <LogOut size={15} /> {labels.logout}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        window.location.reload();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                    >
                      <LogOut size={15} /> {labels.logout}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-3.5 py-2.5 text-[0.82rem] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(217,119,6,0.9)] transition hover:brightness-105 sm:inline-flex lg:px-4 lg:text-sm"
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
        <div className="border-t border-white/60 bg-white/70 backdrop-blur-xl">
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
          {activeUser ? (
            <>
              <Link href={accountHref} className="btn btn-secondary btn-sm justify-center">{labels.account}</Link>
              {activeUser.isStaff ? <Link href="/admin" className="btn btn-secondary btn-sm justify-center">{labels.admin}</Link> : null}
              {user ? (
                <form action={logout}>
                  <button type="submit" className="btn btn-ghost btn-sm w-full justify-center text-danger">{labels.logout}</button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    window.location.reload();
                  }}
                  className="btn btn-ghost btn-sm w-full justify-center text-danger"
                >
                  {labels.logout}
                </button>
              )}
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
