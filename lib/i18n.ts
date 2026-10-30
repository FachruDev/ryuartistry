import type { Localized } from "@/lib/db/schema";

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Pick the string for `lang`, falling back to the other locale when it is empty. */
export function pick(value: Localized | null | undefined, lang: Locale): string {
  if (!value) return "";
  return value[lang] || value[lang === "id" ? "en" : "id"] || "";
}

export function formatDate(date: Date | string | null | undefined, lang: Locale) {
  if (!date) return "";
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
