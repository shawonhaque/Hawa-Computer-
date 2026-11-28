import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Flash } from "@/components/ui/flash";
import { getLocale } from "@/lib/i18n";
import { getSettings, siteTitle } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bengali = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a111d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([getLocale(), getSettings()]);
  const bn = locale === "bn";
  const name = bn ? settings.businessNameBn : settings.businessNameEn;
  const title = siteTitle(name, bn ? settings.taglineBn : settings.taglineEn);
  const description = bn
    ? "কম্পিউটার সেবা, অনলাইন আবেদন, পাসপোর্ট সহায়তা, ফটো স্টুডিও, ডকুমেন্ট প্রস্তুতি, স্টেশনারি, বই ও কম্পিউটার প্রশিক্ষণ — এক ঠিকানায়।"
    : "Computer services, online applications, passport assistance, photo studio, document preparation, stationery, books and computer training — all in one place.";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: title, template: `%s | ${name}` },
    description,
    keywords: bn
      ? ["কম্পিউটার সেবা", "অনলাইন আবেদন", "পাসপোর্ট সহায়তা", "ফটো স্টুডিও", "স্টেশনারি", "কম্পিউটার প্রশিক্ষণ"]
      : ["computer service", "online application", "passport assistance", "photo studio", "stationery", "computer training"],
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description,
      locale: bn ? "bn_BD" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    alternates: { canonical: "/" },
  };
}

const themeScript = `(function(){try{var s=localStorage.getItem('hc_theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "হাওয়া কম্পিউটার / Hawa Computer",
  image: "https://shawonhaque.github.io/Hawa-Computer-/brand/hawa-logo.png",
  url: "https://shawonhaque.github.io/Hawa-Computer-/",
  telephone: "+8801342101686",
  email: "hawacomputer2014@gmail.com",
  priceRange: "৳",
  hasMap: "https://www.google.com/maps?q=25.611141,89.412357",
  address: {
    "@type": "PostalAddress",
    streetAddress: "JC66+FX2, Kaikuri",
    addressLocality: "Gazipur",
    addressRegion: "Dhaka",
    addressCountry: "BD",
  },
  geo: { "@type": "GeoCoordinates", latitude: 25.611141, longitude: 89.412357 },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "09:00",
      closes: "21:00",
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${bengali.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_ROUTE_PREFIX ?? ""}/manifest.webmanifest`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-royal focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <ToastProvider>
          <Suspense fallback={null}>
            <Flash />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
