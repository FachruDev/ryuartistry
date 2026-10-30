import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, locales, pick } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { alternates, siteUrl } from "@/lib/site";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const settings = await getSettings();
  const description = pick(settings?.tagline, lang) || getDictionary(lang).home.heroSubtitle;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "Ryuartistry", template: "%s | Ryuartistry" },
    description,
    alternates: alternates(lang),
    openGraph: {
      siteName: "Ryuartistry",
      locale: lang === "id" ? "id_ID" : "en_US",
      type: "website",
      description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a1d4e",
};

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={`${fontVariables} antialiased`}>
      <body className="min-h-screen bg-paper text-text">
        <a
          href="#main"
          className="sr-only z-[60] rounded bg-scale px-4 py-2 font-semibold text-ink-deep focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {lang === "id" ? "Langsung ke konten" : "Skip to content"}
        </a>
        <SmoothScroll />
        <Header lang={lang} nav={dict.nav} />
        <main id="main">{children}</main>
        <Footer lang={lang} dict={dict} />
      </body>
    </html>
  );
}
