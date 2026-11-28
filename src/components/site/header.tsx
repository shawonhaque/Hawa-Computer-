"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  Phone,
  Search,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/lib/cart";
import { logoutUser, useLocalSession } from "@/lib/local-auth";
import { logout } from "@/actions/auth";
import type { MenuGroup, SearchEntry } from "@/lib/menu";
import type { Locale } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

export function Header({
  locale,
  groups,
  search,
  user,
  brand,
  labels,
}: {
  locale: Locale;
  groups: MenuGroup[];
  search: SearchEntry[];
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
    noResults: string;
    menu: string;
    language: string;
    theme: string;
    dark: string;
    light: string;
    track: string;
    openNow: string;
    closedNow: string;
    hours: string;
    viewAll: string;
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
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const [panelShift, setPanelShift] = useState(0);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
    setOpenGroup(null);
    setOpenMobileGroup(null);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!openGroup) {
      setPanelShift(0);
      return;
    }
    const panel = document.querySelector<HTMLElement>('.nav-drop[data-open="true"] .nav-drop-panel');
    if (!panel) return;
    const overflow = panel.getBoundingClientRect().right + 12 - window.innerWidth;
    setPanelShift(overflow > 0 ? -Math.ceil(overflow) : 0);
  }, [openGroup]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
        setSearching(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!searching) return;
    const timer = window.setTimeout(() => setSearching(false), 260);
    return () => window.clearTimeout(timer);
  }, [searching, query]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const groupActive = (group: MenuGroup) =>
    isActive(group.href) || (group.columns?.some((column) => isActive(column.href)) ?? false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return search
      .filter((item) => item.label.toLowerCase().includes(term) || item.kind.toLowerCase().includes(term))
      .slice(0, 8);
  }, [query, search]);

  const openStatus = useShopOpen();

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

  const searchPanel = searchOpen ? (
    <div className="border-t border-white/60 px-3 pb-3 pt-2 sm:px-4">
      <form action="/search" role="search" onSubmit={() => setSearchOpen(false)}>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearching(true);
            }}
            autoFocus
            placeholder={labels.searchPlaceholder}
            aria-label={labels.search}
            className="input border-white/70 bg-white/70 pl-9 pr-9 backdrop-blur"
          />
          {searching ? (
            <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-royal" />
          ) : null}
        </div>
      </form>

      {query.trim().length >= 2 ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_50px_-30px_rgba(29,27,49,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111a28]">
          {searching ? (
            <div className="space-y-1.5 p-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-2 p-1.5">
                  <span className="skeleton size-7 rounded-lg" />
                  <span className="skeleton h-3 flex-1 rounded-full" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">{labels.noResults}</p>
          ) : (
            <ul className="p-1.5">
              {results.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition hover:bg-white dark:hover:bg-white/10"
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-royal/10 text-royal">
                      <PackageSearch size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="shrink-0 rounded-full bg-royal-soft px-2 py-0.5 text-[0.62rem] font-semibold text-royal">
                      {item.kind}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-royal-soft px-3 py-2 text-xs font-semibold text-royal hover:bg-royal/15"
                >
                  {labels.viewAll} <ArrowRight size={13} />
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-4">
      <header
        className={cn(
          "mx-auto max-w-[1200px] rounded-[1.4rem] border transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-white/80 bg-white/80 shadow-[0_22px_50px_-30px_rgba(29,27,49,0.55)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0d1522]/90"
            : "border-white/60 bg-white/60 shadow-[0_16px_40px_-32px_rgba(29,27,49,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1522]/80",
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
            className="relative col-start-2 row-start-1 hidden min-w-0 items-center justify-center gap-x-1 xl:flex"
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
                    setOpenGroup(group.columns ? group.href : null);
                    movePillTo(navRef.current?.querySelector<HTMLElement>(`[data-group="${group.href}"]`) ?? null);
                  }}
                >
                  <Link
                    href={group.href}
                    data-group={group.href}
                    data-active={active ? "true" : "false"}
                    aria-haspopup={group.columns ? "true" : undefined}
                    aria-expanded={group.columns ? expanded : undefined}
                    onFocus={() => setOpenGroup(group.columns ? group.href : null)}
                    className={cn(
                      "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.84rem] font-semibold transition-colors duration-200 xl:text-[0.88rem]",
                      active ? "text-royal" : "text-[#4a4759] hover:text-royal dark:text-slate-300",
                    )}
                  >
                    {group.label}
                    {group.columns ? (
                      <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
                    ) : null}
                  </Link>

                  {group.columns ? (
                    <div
                      className={cn(
                        "nav-drop-panel nav-mega absolute top-full pt-2",
                        (group.columns?.length ?? 0) < 3 && "nav-mega--2",
                      )}
                      style={expanded ? { marginLeft: panelShift } : undefined}
                    >
                      <div className="grid gap-1 rounded-2xl border border-white/80 bg-white p-2.5 shadow-[0_34px_70px_-38px_rgba(29,27,49,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111a28] sm:grid-cols-2 lg:grid-cols-3">
                        {group.columns.map((column) => (
                          <div key={column.href} className="min-w-0 rounded-xl p-1.5">
                            <Link
                              href={column.href}
                              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.78rem] font-bold uppercase tracking-wide text-royal hover:bg-royal-soft"
                            >
                              {column.label}
                            </Link>
                            <ul className="mt-1 space-y-0.5">
                              {column.links.map((link) => (
                                <li key={`${column.href}-${link.href}-${link.label}`}>
                                  <Link
                                    href={link.href}
                                    className="group/link flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[0.82rem] leading-snug text-[#4a4759] transition hover:bg-white hover:text-royal dark:text-slate-300 dark:hover:bg-white/10"
                                  >
                                    <ChevronRight
                                      size={13}
                                      className="mt-0.5 shrink-0 text-royal/60 transition group-hover/link:translate-x-0.5"
                                    />
                                    <span className="min-w-0">{link.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <Link
                              href={column.href}
                              className="mt-1 flex items-center gap-1 px-2 py-1.5 text-[0.75rem] font-semibold text-royal hover:underline"
                            >
                              {column.allLabel} <ArrowRight size={12} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

          </nav>

          <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-x-1 justify-self-end">
            <Link
              href="/track"
              className="mr-1 hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-royal/30 bg-white/60 px-3 py-1.5 text-[0.8rem] font-semibold text-royal transition hover:-translate-y-0.5 hover:bg-white dark:border-royal/40 dark:bg-white/5 xl:flex"
            >
              <Truck size={14} /> {labels.track}
            </Link>
            <span
              title={labels.hours}
              className={cn(
                "mr-1 hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold 2xl:flex",
                openStatus
                  ? "border-emerald-300/70 bg-emerald-50/80 text-emerald-700"
                  : "border-rose-200/70 bg-rose-50/80 text-rose-600",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  openStatus ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "bg-rose-500",
                )}
              />
              {openStatus ? labels.openNow : labels.closedNow}
            </span>

            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label={labels.search}
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal dark:text-slate-300 dark:hover:bg-white/10"
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
              className="relative grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal dark:text-slate-300 dark:hover:bg-white/10"
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
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-1.5 shadow-[0_28px_60px_-34px_rgba(29,27,49,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111a28]">
                    <Link href={accountHref} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white dark:hover:bg-white/10">
                      <User size={15} /> {labels.account}
                    </Link>
                    <Link href="/track" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white dark:hover:bg-white/10 xl:hidden">
                      <Truck size={15} /> {labels.track}
                    </Link>
                    {activeUser.isStaff ? (
                      <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white dark:hover:bg-white/10">
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
              className="grid size-9 place-items-center rounded-full text-[#4a4759] transition hover:bg-white/70 hover:text-royal dark:text-slate-300 dark:hover:bg-white/10 xl:hidden"
              aria-label={labels.menu}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div ref={searchRef}>{searchPanel}</div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity xl:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-10/12 max-w-xs flex-col overflow-y-auto border-r border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur-2xl transition-transform duration-300 dark:bg-[#0b1421]/95 xl:hidden",
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
          {groups.map((group) => {
            const expanded = openMobileGroup === group.href;
            return (
              <div key={group.href}>
                {group.columns ? (
                  <>
                    <div className="flex items-center">
                      <Link
                        href={group.href}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold",
                          groupActive(group) ? "bg-royal-soft text-royal" : "text-[#3f3c50]",
                        )}
                      >
                        {group.label}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={group.label}
                        onClick={() => setOpenMobileGroup(expanded ? null : group.href)}
                        className="grid size-9 place-items-center rounded-xl text-[#55526a] hover:bg-white/80 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
                      </button>
                    </div>
                    <div className={cn("overflow-hidden transition-[max-height]", expanded ? "max-h-[46rem]" : "max-h-0")}>
                      <div className="mb-1 ml-3 space-y-2 border-l border-line pl-3 pt-1">
                        {group.columns.map((column) => (
                          <div key={column.href}>
                            <Link href={column.href} className="text-[0.78rem] font-bold uppercase tracking-wide text-royal">
                              {column.label}
                            </Link>
                            <ul className="mt-1 space-y-0.5">
                              {column.links.map((link) => (
                                <li key={`${column.href}-${link.href}-${link.label}`}>
                                  <Link
                                    href={link.href}
                                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.85rem] text-[#55526a] hover:text-royal dark:text-slate-300"
                                  >
                                    <ChevronRight size={12} className="text-royal/60" /> {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={group.href}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold",
                      groupActive(group) ? "bg-royal-soft text-royal" : "text-[#3f3c50] hover:bg-white/80",
                    )}
                  >
                    {group.label}
                  </Link>
                )}
              </div>
            );
          })}

          <Link
            href="/track"
            className="mt-1 flex items-center gap-2 rounded-xl border border-royal/25 bg-royal-soft/60 px-3 py-2.5 text-[0.9rem] font-semibold text-royal"
          >
            <Truck size={15} /> {labels.track}
          </Link>
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

        <div className="mt-auto flex items-center gap-2 pt-6 text-xs text-muted">
          <Phone size={13} className="text-royal" />
          <span>{labels.hours}</span>
        </div>
      </aside>
    </div>
  );
}

/** Shop hours: Saturday–Thursday, 09:00–21:00 Dhaka time. */
function useShopOpen() {
  const [openStatus, setOpenStatus] = useState(true);
  useEffect(() => {
    const check = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        hour12: false,
      }).formatToParts(new Date());
      const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
      const hour = Number(get("hour"));
      const weekday = get("weekday");
      setOpenStatus(weekday !== "Fri" && hour >= 9 && hour < 21);
    };
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return openStatus;
}
