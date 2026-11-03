import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";

// On Vercel, fall back to the project's production domain (custom domain once one is assigned).
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;

export const siteUrl = (process.env.SITE_URL || vercelProductionUrl || "http://localhost:3000").replace(/\/$/, "");

/** `alternates` for a path that exists in every locale, e.g. `/work/foo`. */
export function alternates(lang: Locale, path = ""): Metadata["alternates"] {
  return {
    canonical: `/${lang}${path}`,
    languages: { ...Object.fromEntries(locales.map((l) => [l === "id" ? "id-ID" : "en-US", `/${l}${path}`])), "x-default": `/id${path}` },
  };
}

/**
 * Open Graph for one page. Next replaces the layout's openGraph object instead of merging it,
 * so the shared fields are repeated here.
 */
export function openGraph(lang: Locale, path: string, extra: NonNullable<Metadata["openGraph"]> = {}): Metadata["openGraph"] {
  return {
    siteName: "Ryuartistry",
    locale: lang === "id" ? "id_ID" : "en_US",
    alternateLocale: lang === "id" ? "en_US" : "id_ID",
    url: `/${lang}${path}`,
    type: "website",
    // A page-level openGraph also drops the file-based opengraph-image, so point back to it.
    images: [{ url: `/${lang}/opengraph-image`, width: 1200, height: 630, alt: "Ryuartistry" }],
    ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined)),
  } as Metadata["openGraph"];
}
