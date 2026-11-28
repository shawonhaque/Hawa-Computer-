"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  Wrench,
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
type Group = NavItem & { children?: (NavItem & { icon: typeof FileText })[] };

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
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
    setOpenGroup(null);
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

  const labelOf = (href: string, fallback: string) =>
    nav.find((item) => item.href === href)?.label ?? fallback;

  const bn = locale === "bn";
  const groups: Group[] = [
    { href: "/", label: labelOf("/", bn ? "হোম" : "Home") },
    {
      href: "/services",
      label: labelOf("/services", bn ? "সেবাসমূহ" : "Services"),
      children: [
        { href: "/applications", label: labelOf("/applications", bn ? "অনলাইন আবেদন" : "Online applications"), icon: FileText },
        { href: "/tools", label: labelOf("/tools", bn ? "টুলস ও প্যাকেজ" : "Tools & packages"), icon: Wrench },
        { href: "/training", label: labelOf("/training", bn ? "কম্পিউটার প্রশিক্ষণ" : "Computer training"), icon: GraduationCap },
      ],
    },
    {
      href: "/shop",
      label: bn ? "শপ" : "Shop",
      children: [
        { href: "/shop", label: bn ? "স্টেশনারি শপ" : "Stationery shop", icon: ShoppingBag },
        { href: "/library", label: bn ? "বই ও লাইব্রেরি" : "Books & library", icon: BookOpen },
      ],
    },
    { href: "/about", label: labelOf("/about", bn ? "আমাদের সম্পর্কে" : "About us") },
    { href: "/contact", label: labelOf("/contact", bn ? "যোগাযোগ" : "Contact") },
  ];

  const groupActive = (group: Group) =>
    isActive(group.href) || (group.children?.some((child) => isActive(child.href)) ?? false);

  function movePillTo(element: HTMLElement | null) {
    const navElement = navRef.current;
    if (!navElement || !element) {
      setPill((current) => ({ ...current, visible: false }));
      return;
    }
    const navBox = navElement.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    setPill({ left: box.left - navBox.left, width: box.width, visible: true });
  }

  function resetPill() {
    movePillTo(navRef.current?.querySelector<HTMLElement>('[data-active="true"]') ?? null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    resetPill();
    window.addEventListener("resize", resetPill);
    return () => window.removeEventListener("resize", resetPill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-4">
      <header
        className={cn(
          "mx-auto max-w-[1200px] rounded-[1.4rem] border transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-white/80 bg-white/70 shadow-[0_22px_50px_-30px_rgba(29,27,49,0.55)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-white/60 bg-white/55 shadow-[0_16px_40px_-32px_rgba(29,27,49,0.45)] backdrop-blur-xl",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-[auto_1fr_auto] items-center gap-x-2 px-3 transition-[padding] duration-300 sm:px-4",
            scrolled ? "py-1.5" : "py-2",
          )}
        >
          <div className="col-start-1 row-start-1 shrink-0">
            <Logo name={brand.name} tagline={brand.tagline} />
          </div>

          <nav
            ref={navRef}
            onMouseLeave={resetPill}
            className="relative col-start-2 row-start-1 hidden min-w-0 items-center justify-center gap-x-1 lg:flex"
            aria-label="Main"
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-y-0.5 left-0 rounded-full bg-royal-soft/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm transition-all duration-300 ease-out",
                pill.visible ? "opacity-100" : "opacity-0",
              )}
              style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
            />

            {groups.map((group) => {
              const active = groupActive(group);
              const expanded = openGroup === group.href;
              return (
                <div
                  key={group.href}
                  data-open={expanded ? "true" : "false"}
                  className="nav-drop relative z-10"
                  onMouseEnter={() => {
                    setOpenGroup(group.children ? group.href : null);
                    movePillTo(
                      navRef.current?.querySelector<HTMLElement>(`[data-group="${group.href}"]`) ?? null,
                    );
                  }}
                >
                  <Link
                    href={group.href}
                    data-group={group.href}
                    data-active={active ? "true" : "false"}
                    aria-haspopup={group.children ? "true" : undefined}
                    aria-expanded={group.children ? expanded : undefined}
                    onFocus={() => setOpenGroup(group.children ? group.href : null)}
                    className={cn(
                      "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.86rem] font-semibold transition-colors duration-200 xl:text-[0.9rem]",
                      active ? "text-royal" : "text-[#4a4759] hover:text-royal",
                    )}
                  >
                    {group.label}
                    {group.children ? (
                      <ChevronDown
                        size={13}
                        className={cn("transition-transform duration-200", expanded && "rotate-180")}
                      />
                    ) : null}
                  </Link>

                  {group.children ? (
                    <div className="nav-drop-panel absolute top-full w-60 pt-2">
                      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-[0_28px_60px_-34px_rgba(29,27,49,0.6)] backdrop-blur-2xl">
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
                              isActive(child.href)
                                ? "bg-royal-soft text-royal"
                                : "text-[#4a4759] hover:bg-white hover:text-royal",
                            )}
                          >
                            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-royal/10 text-royal">
                              <child.icon size={14} />
                            </span>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-x-1 justify-self-end">
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label={labels.search}
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal"
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
              className="relative grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal"
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
                  className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(217,119,6,0.9)] transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[0.6rem] font-bold">
                    {activeUser.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate sm:block">{activeUser.name.split(" ")[0]}</span>
                  <ChevronDown size={13} />
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-1.5 shadow-[0_28px_60px_-34px_rgba(29,27,49,0.6)] backdrop-blur-2xl">
                    <Link href={accountHref} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white">
                      <User size={15} /> {labels.account}
                    </Link>
                    {activeUser.isStaff ? (
                      <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white">
                        <LayoutDashboard size={15} /> {labels.admin}
                      </Link>
                    ) : null}
                    {user ? (
                      <form action={logout}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
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
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
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
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#f59e0b,var(--royal))] px-4 py-2.5 text-[0.84rem] font-semibold text-white shadow-[0_10px_24px_-14px_rgba(217,119,6,0.9)] transition hover:-translate-y-0.5 hover:brightness-105 sm:inline-flex"
              >
                <LogIn size={16} /> {labels.login}
              </Link>
            )}

            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal lg:hidden"
              aria-label={labels.menu}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-white/60 px-3 pb-3 pt-2 sm:px-4">
            <form action="/search" role="search">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  name="q"
                  autoFocus
                  placeholder={labels.searchPlaceholder}
                  aria-label={labels.search}
                  className="input border-white/70 bg-white/70 pl-9 backdrop-blur"
                />
              </div>
            </form>
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-10/12 max-w-xs flex-col overflow-y-auto border-r border-white/60 bg-white/85 p-5 shadow-xl backdrop-blur-2xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="mb-5 flex items-center justify-between">
          <Logo name={brand.name} tagline={brand.tagline} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.menu}
            className="grid size-9 place-items-center rounded-full hover:bg-white/80"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5" aria-label="Mobile">
          {groups.map((group) => (
            <div key={group.href}>
              <Link
                href={group.href}
                className={cn(
                  "block rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold",
                  groupActive(group) ? "bg-royal-soft text-royal" : "text-[#3f3c50] hover:bg-white/80",
                )}
              >
                {group.label}
              </Link>
              {group.children ? (
                <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-line pl-3">
                  {group.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.88rem] font-medium",
                        isActive(child.href) ? "text-royal" : "text-[#55526a] hover:text-royal",
                      )}
                    >
                      <child.icon size={14} /> {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
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
    </div>
  );
}
