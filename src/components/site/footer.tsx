import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Link2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { getDict, type Locale } from "@/lib/dictionaries";
import type { SiteSettings } from "@/lib/settings";

export function Footer({
  locale,
  settings,
}: {
  locale: Locale;
  settings: SiteSettings;
}) {
  const d = getDict(locale);
  const bn = locale === "bn";
  const name = bn ? settings.businessNameBn : settings.businessNameEn;
  const tagline = bn ? settings.taglineBn : settings.taglineEn;
  const address = bn ? settings.addressBn : settings.addressEn;
  const hours = bn ? settings.hoursBn : settings.hoursEn;

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={name} tagline={tagline} />
          <p className="mt-4 text-sm leading-relaxed text-muted">{d.footer.disclaimer}</p>
          {settings.facebook ? (
            <a href={settings.facebook} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-royal">
              <Link2 size={15} /> Facebook
            </a>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold">{d.footer.quickLinks}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[
              { href: "/services", label: d.nav.services },
              { href: "/applications", label: d.nav.applications },
              { href: "/shop", label: d.nav.shop },
              { href: "/library", label: d.nav.library },
              { href: "/training", label: d.nav.training },
              { href: "/track", label: d.nav.track },
              { href: "/my-account", label: d.common.account },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-royal">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{d.footer.legal}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[
              { href: "/p/privacy-policy", label: d.footer.privacy },
              { href: "/p/terms", label: d.footer.terms },
              { href: "/p/refund-policy", label: d.footer.refund },
              { href: "/faq", label: d.nav.faq },
              { href: "/about", label: d.nav.about },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-royal">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{d.nav.contact}</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-muted">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" /> <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="shrink-0" />
              <a href={`tel:${settings.phone}`} className="hover:text-royal">{settings.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-royal">{settings.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0" /> <span>{hours}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. {d.footer.rights}</p>
          <p className="text-center sm:text-right">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
