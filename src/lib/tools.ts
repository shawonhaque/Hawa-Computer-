export type SiteTool = {
  id: "photo" | "pdf" | "image" | "signature";
  href: string;
  bn: string;
  en: string;
  noteBn: string;
  noteEn: string;
};

/** Interactive tools that run entirely in the browser. */
export const SITE_TOOLS: SiteTool[] = [
  {
    id: "photo",
    href: "/tools/photo",
    bn: "ফটো এডিটর",
    en: "Photo editor",
    noteBn: "পাসপোর্ট / ভিসা সাইজ ক্রপ, আলো ঠিক করা, ৪×৬ প্রিন্ট শিট",
    noteEn: "Passport / visa crop, light correction, 4×6 print sheet",
  },
  {
    id: "pdf",
    href: "/tools/pdf",
    bn: "ছবি থেকে PDF",
    en: "Images to PDF",
    noteBn: "একাধিক ছবি সাজিয়ে A4 / Letter PDF বানান, সাইজ ঠিক রাখুন",
    noteEn: "Arrange several photos into an A4 or Letter PDF at the right size",
  },
  {
    id: "image",
    href: "/tools/image",
    bn: "ছবি ছোট করুন",
    en: "Compress & resize",
    noteBn: "ফাইল সাইজ কমান, প্রস্থ ঠিক করুন, JPG / PNG / WebP বানান",
    noteEn: "Shrink file size, set the width, convert to JPG / PNG / WebP",
  },
  {
    id: "signature",
    href: "/tools/signature",
    bn: "স্বাক্ষর ও ছবি রিসাইজ",
    en: "Signature cutter",
    noteBn: "কাগজের ব্যাকগ্রাউন্ড সাদা করে স্বাক্ষর কাটুন, আবেদনের সাইজে নামান",
    noteEn: "Clean the paper background off a signature and size it for applications",
  },
];

export const SITE_TOOL_COUNT = SITE_TOOLS.length;
