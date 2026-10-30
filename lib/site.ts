import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";

export const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** `alternates` for a path that exists in every locale, e.g. `/work/foo`. */
export function alternates(lang: Locale, path = ""): Metadata["alternates"] {
  return {
    canonical: `/${lang}${path}`,
    languages: Object.fromEntries(locales.map((l) => [l === "id" ? "id-ID" : "en-US", `/${l}${path}`])),
  };
}
