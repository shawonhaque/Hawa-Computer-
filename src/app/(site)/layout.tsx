import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { FloatingActions } from "@/components/site/floating-actions";
import { SiteLoader } from "@/components/site/site-loader";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getSessionUser } from "@/lib/auth";
import { getDict, type Locale } from "@/lib/dictionaries";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { getLocale } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = await getLocale();
  const d = getDict(locale);
  const settings = await getSettings();
  const user = await getSessionUser();
  const bn = locale === "bn";
  const { groups, search } = await getMenu(locale);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteLoader label={bn ? "লোড হচ্ছে…" : "Loading…"} />
      <ScrollReveal />

      <Header
        locale={locale}
        groups={groups}
        search={search}
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
          noResults: bn ? "কিছু পাওয়া যায়নি" : "Nothing matched",
          menu: d.nav.home,
          language: d.common.language,
          theme: d.common.theme,
          dark: d.common.dark,
          light: d.common.light,
          track: d.nav.track,
          openNow: bn ? "এখন খোলা" : "Open now",
          closedNow: bn ? "এখন বন্ধ" : "Closed now",
          hours: bn ? settings.hoursBn : settings.hoursEn,
          viewAll: bn ? "সব ফলাফল" : "All results",
        }}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer locale={locale} settings={settings} />
      <FloatingActions
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        labels={{
          whatsapp: bn ? "হোয়াটসঅ্যাপে মেসেজ দিন" : "Message us on WhatsApp",
          call: bn ? "ফোন করুন" : "Call us",
          top: bn ? "উপরে যান" : "Back to top",
        }}
      />
    </div>
  );
}
