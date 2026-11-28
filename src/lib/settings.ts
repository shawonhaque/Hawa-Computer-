import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

export type SiteSettings = {
  businessNameBn: string;
  businessNameEn: string;
  taglineBn: string;
  taglineEn: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressBn: string;
  addressEn: string;
  hoursBn: string;
  hoursEn: string;
  mapEmbedUrl: string;
  mapUrl: string;
  facebook: string;
  deliveryInside: number;
  deliveryOutside: number;
  freeDeliveryAbove: number;
  paymentNoteBn: string;
  paymentNoteEn: string;
  heroImageUrl: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  businessNameBn: "হাওয়া কম্পিউটার",
  businessNameEn: "Hawa Computer",
  taglineBn: "ডিজিটাল সেবার নির্ভরযোগ্য ঠিকানা",
  taglineEn: "Your trusted digital service centre",
  phone: process.env.BUSINESS_PHONE ?? "+8801342101686",
  whatsapp: process.env.BUSINESS_WHATSAPP ?? "8801342101686",
  email: process.env.BUSINESS_EMAIL ?? "hawacomputer2014@gmail.com",
  addressBn: "JC66+FX2, কাইকুড়ি, গাজীপুর — ২৫.৬১১১৪১, ৮৯.৪১২৩৫৭",
  addressEn: "JC66+FX2, Kaikuri, Gazipur — 25.611141, 89.412357",
  hoursBn: "শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা",
  hoursEn: "Saturday – Thursday, 9am – 9pm",
  mapEmbedUrl: "https://maps.google.com/maps?q=25.611141,89.412357&z=16&hl=bn&output=embed",
  mapUrl: "https://www.google.com/maps?q=25.611141,89.412357",
  facebook: "",
  deliveryInside: 60,
  deliveryOutside: 120,
  freeDeliveryAbove: 3000,
  paymentNoteBn: "পেমেন্ট পাঠানোর পর ট্রানজেকশন আইডি দিন। আমাদের টিম যাচাই করে নিশ্চিত করবে।",
  paymentNoteEn: "Send money, then submit the transaction ID. Our team verifies it before confirming.",
  heroImageUrl: "",
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await prisma.siteSetting.findMany();
    const merged = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key in merged && row.value !== null) {
        (merged as Record<string, unknown>)[row.key] = row.value;
      }
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export async function saveSettings(patch: Partial<SiteSettings>) {
  const entries = Object.entries(patch);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    ),
  );
}
