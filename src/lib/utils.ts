import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTaka(amount: number, locale: Locale = "bn") {
  const value = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `৳ ${value}`;
}

export function formatNumber(value: number, locale: Locale = "bn") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD").format(value);
}

export function formatDate(date: Date | string, locale: Locale = "bn") {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale: Locale = "bn") {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, max = 120) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Bengali digits are not ASCII; normalise before validating phone numbers. */
export function normalisePhone(input: string) {
  const map: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
  return input.replace(/[০-৯]/g, (d) => map[d] ?? d).replace(/[\s-]/g, "");
}

export function toInt(value: FormDataEntryValue | null | undefined, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function toStr(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function toBool(value: FormDataEntryValue | null | undefined) {
  const v = String(value ?? "").toLowerCase();
  return v === "on" || v === "true" || v === "1";
}

export function toJson<T>(value: unknown, fallback: T): T {
  try {
    return value ? (JSON.parse(String(value)) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
