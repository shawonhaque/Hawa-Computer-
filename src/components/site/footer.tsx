import Link from "next/link";
import { Clock, CreditCard, Mail, MapPin, MessageCircle, Navigation, Phone, ShoppingBag, Truck, User } from "lucide-react";
import { getDict, type Locale } from "@/lib/dictionaries";
import type { SiteSettings } from "@/lib/settings";

export function Footer({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const d = getDict(locale);
  const bn = locale === "bn";
  const name = bn ? settings.businessNameBn : settings.businessNameEn;
  const tagline = bn ? settings.taglineBn : settings.taglineEn;
  const address = bn ? settings.addressBn : settings.addressEn;
  const hours = bn ? settings.hoursBn : settings.hoursEn;
  const whatsapp = settings.whatsapp.replace(/[^0-9]/g, "");

  const quickLinks = [
    { href: "/services", label: d.nav.services },
    { href: "/applications", label: d.nav.applications },
    { href: "/shop", label: d.nav.shop },
    { href: "/library", label: d.nav.library },
    { href: "/training", label: d.nav.training },
  ];

  const companyLinks = [
    { href: "/about", label: d.nav.about },
    { href: "/contact", label: d.nav.contact },
    { href: "/faq", label: d.nav.faq },
    { href: "/p/privacy-policy", label: d.footer.privacy },
    { href: "/p/terms", label: d.footer.terms },
    { href: "/p/refund-policy", label: d.footer.refund },
  ];

  const payments = bn
    ? ["বিকাশ", "নগদ", "রকেট", "কার্ড"]
    : ["bKash", "Nagad", "Rocket", "Card"];

  return (
    <footer className="mt-auto border-t border-white/70 bg-white/50 backdrop-blur-xl">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_0.85fr_1.15fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hawa-logo.png"
              alt={name}
              width={560}
              height={427}
              loading="lazy"
              className="h-16 w-auto object-contain drop-shadow-[0_10px_24px_rgba(29,27,49,0.16)]"
            />
            <p className="mt-3 text-sm font-bold">{name}</p>
            {tagline ? <p className="text-xs text-muted">{tagline}</p> : null}

            <div className="mt-4 flex items-center gap-2">
              {settings.facebook ? (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Facebook"
                  className="grid size-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#1877f2] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
                  </svg>
                </a>
              ) : null}
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="WhatsApp"
                className="grid size-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#25D366] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="https://www.youtube.com/results?search_query=hawa+computer"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="YouTube"
                className="grid size-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#ff0000] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
                </svg>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">
                {bn ? "পেমেন্ট" : "Payments"}
              </span>
              {payments.map((payment) => (
                <span
                  key={payment}
                  className="inline-flex items-center gap-1 rounded-md border border-white/80 bg-white/80 px-2 py-1 text-[0.68rem] font-semibold text-[#4a4759] shadow-[0_8px_18px_-16px_rgba(29,27,49,0.6)]"
                >
                  <CreditCard size={11} className="text-royal" /> {payment}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{d.footer.quickLinks}</h3>
            <ul className="mt-2.5 space-y-1.5 text-sm text-muted">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-royal">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{bn ? "প্রতিষ্ঠান" : "Company"}</h3>
            <ul className="mt-2.5 space-y-1.5 text-sm text-muted">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-royal">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{d.nav.contact}</h3>
            <ul className="mt-2.5 space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-royal" />
                <a
                  href={settings.mapUrl || "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition hover:text-royal"
                  title={bn ? "গুগল ম্যাপে দেখুন" : "Open in Google Maps"}
                >
                  {address}
                  <span className="mt-0.5 flex items-center gap-1 text-[0.72rem] font-semibold text-royal">
                    <Navigation size={11} /> {bn ? "ম্যাপে দেখুন" : "View on map"}
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-royal" />
                <a href={`tel:${settings.phone}`} className="hover:text-royal">{settings.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-royal" />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-royal">{settings.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-royal" /> <span>{hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-2 rounded-2xl border border-white/70 bg-white/55 p-3 sm:grid-cols-2">
          <Link
            href="/track"
            className="flex items-center justify-center gap-2 rounded-xl bg-royal-soft px-3 py-2.5 text-sm font-semibold text-royal transition hover:bg-royal/15"
          >
            <Truck size={16} /> {d.nav.track}
          </Link>
          <Link
            href="/my-account"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#4a4759] transition hover:text-royal"
          >
            <User size={16} /> {d.common.account}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/70">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. {d.footer.rights}</p>
          {tagline ? (
            <p className="flex items-center gap-1.5">
              <ShoppingBag size={12} className="text-royal" /> {tagline}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
