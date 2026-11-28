import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone, UserRound } from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { ContactForm } from "@/components/site/contact-form";
import { StaticContactForm } from "@/components/site/static-contact-form";
import { STATIC_MODE } from "@/lib/static-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "bn" ? "যোগাযোগ" : "Contact",
    description: locale === "bn" ? "ফোন, হোয়াটসঅ্যাপ বা সরাসরি দোকানে যোগাযোগ করুন।" : "Reach us by phone, WhatsApp or visit the shop.",
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow={bn ? "যোগাযোগ" : "Contact"}
        title={d.home.contactTitle}
        description={d.home.contactSub}
      />

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.contact }]} />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-base font-semibold">{bn ? "যোগাযোগের তথ্য" : "Contact details"}</h2>
              <p className="mt-2 text-sm text-muted">
                {bn
                  ? "আমি বাদল মিয়া। আপনার কোনো প্রশ্ন, পরামর্শ বা কাজের বিষয়ে জানতে চাইলে সরাসরি যোগাযোগ করতে পারেন — যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করব।"
                  : "I am Badol Mia. Reach out with any question, suggestion or work request and I will reply as soon as possible."}
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <UserRound size={16} className="mt-0.5 shrink-0 text-royal" />
                  <span>{bn ? "বাদল মিয়া (Badol Mia)" : "Badol Mia"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-royal" />
                  <a href={`tel:${settings.phone}`} className="hover:text-royal">{settings.phone}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="mt-0.5 shrink-0 text-royal" />
                  <a href={`mailto:${settings.email}`} className="hover:text-royal">{settings.email}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-royal" />
                  <span className="text-muted">{bn ? settings.addressBn : settings.addressEn}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-royal" />
                  <span className="text-muted">{bn ? settings.hoursBn : settings.hoursEn}</span>
                </li>
              </ul>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-secondary mt-4 w-full"
              >
                <MessageSquare size={15} /> WhatsApp
              </a>
            </div>

            {settings.mapEmbedUrl ? (
              <iframe
                src={settings.mapEmbedUrl}
                title="Map"
                className="h-64 w-full rounded-2xl border border-line"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : null}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold">{bn ? "বার্তা পাঠান" : "Send a message"}</h2>
            <p className="mt-1 text-xs text-muted">
              {bn ? "আমরা সাধারণত এক কর্মদিবসের মধ্যে উত্তর দিই।" : "We usually reply within one working day."}
            </p>
            <div className="mt-4">
              {STATIC_MODE ? (
                <StaticContactForm en={!bn} email={settings.email} whatsapp={settings.whatsapp} />
              ) : (
              <ContactForm
                labels={{
                  name: d.auth.name,
                  email: d.auth.email,
                  phone: d.auth.phone,
                  subject: bn ? "বিষয়" : "Subject",
                  message: bn ? "বার্তা" : "Message",
                  submit: d.common.submit,
                  success: bn ? "ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে।" : "Thank you! Your message has been sent.",
                  error: d.common.somethingWrong,
                  invalidEmail: d.validation.email,
                  invalidPhone: d.validation.phone,
                  required: d.validation.required,
                }}
              />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
