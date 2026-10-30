import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";

// On Vercel, fall back to the project's production domain (custom domain once one is assigned).
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;

export const siteUrl = (process.env.SITE_URL || vercelProductionUrl || "http://localhost:3000").replace(/\/$/, "");

/** `alternates` for a path that exists in every locale, e.g. `/work/foo`. */
export function alternates(lang: Locale, path = ""): Metadata["alternates"] {
  return {
    canonical: `/${lang}${path}`,
    languages: Object.fromEntries(locales.map((l) => [l === "id" ? "id-ID" : "en-US", `/${l}${path}`])),
  };
}
