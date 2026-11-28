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

  const announcements = bn
    ? [
        "পাসপোর্ট সাইজ ছবি এক ক্লিকে — ফটো এডিটর চালু",
        "প্রিন্ট, ফটোকপি, স্ক্যান একই ছাদের নিচে",
        "অনলাইন আবেদন: পাসপোর্ট, এনআইডি, জন্ম নিবন্ধন, ভর্তি",
        "শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা",
      ]
    : [
        "Passport size photo in one click — photo editor is live",
        "Print, photocopy and scanning under one roof",
        "Online applications: passport, NID, birth registration, admission",
        "Saturday–Thursday, 9am – 9pm",
      ];

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="overflow-hidden border-b border-[#ffe6bf] bg-[#fff6e9]">
        <div className="container-page flex h-9 items-center gap-4 text-[0.72rem] font-medium text-[#7a5a1e]">
          <div className="marquee min-w-0 flex-1">
            <div className="marquee__track">
              {[...announcements, ...announcements].map((item, index) => (
                <span key={`${item}-${index}`} className="flex shrink-0 items-center gap-1.5">
                  <span className="text-royal">✦</span> {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <a href={`tel:${settings.phone}`} className="font-semibold text-royal hover:underline">{settings.phone}</a>
            <a href="/track" className="hover:text-royal">{d.nav.track}</a>
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
