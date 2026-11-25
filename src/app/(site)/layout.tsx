import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import { getSessionUser } from "@/lib/auth";
import { getDict, type Locale } from "@/lib/dictionaries";
import { publicNav } from "@/lib/nav";
import { getSettings } from "@/lib/settings";
import { getLocale } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = await getLocale();
  const d = getDict(locale);
  const settings = await getSettings();
  const user = await getSessionUser();
  const bn = locale === "bn";

  const nav = publicNav.map((item) => ({
    href: item.href,
    label: d.nav[item.key as keyof typeof d.nav],
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="hidden border-b border-line bg-navy text-white/90 md:block dark:bg-[#0d1626]">
        <div className="container-page flex h-9 items-center justify-between text-[0.72rem]">
          <p>{bn ? "শনিবার – বৃহস্পতিবার, সকাল ৯টা – রাত ৯টা" : "Saturday – Thursday, 9am – 9pm"}</p>
          <div className="flex items-center gap-4">
            <a href={`tel:${settings.phone}`} className="hover:text-cyan">{settings.phone}</a>
            <a href="/track" className="hover:text-cyan">{d.nav.track}</a>
          </div>
        </div>
      </div>

      <Header
        locale={locale}
        nav={nav}
        user={user ? { name: user.name, isStaff: user.role.isStaff } : null}
        brand={{
          name: bn ? settings.businessNameBn : settings.businessNameEn,
          tagline: bn ? settings.taglineBn : settings.taglineEn,
        }}
        labels={{
          login: d.common.login,
          register: d.common.register,
          account: d.common.account,
          admin: d.common.admin,
          logout: d.common.logout,
          cart: d.common.cart,
          search: d.common.search,
          searchPlaceholder: d.common.searchPlaceholder,
          menu: d.nav.home,
          language: d.common.language,
          theme: d.common.theme,
          dark: d.common.dark,
          light: d.common.light,
        }}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer locale={locale} settings={settings} />
      <WhatsAppFloat number={settings.whatsapp} label={d.nav.contact} />
    </div>
  );
}
