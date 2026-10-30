import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, locales, pick } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { alternates, siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { HeroGlow } from "@/components/site/hero-glow";
import { ThemeSync } from "@/components/site/theme-toggle";
import { Analytics } from "@/components/site/analytics";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1724" },
  ],
};

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    // The inline script sets data-theme before paint, so React must accept the attribute it finds.
    <html lang={lang} className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="relative isolate min-h-screen bg-paper text-ink">
        <a
          href="#main"
          className="sr-only rounded-full bg-ink px-5 py-2.5 font-semibold text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          {dict.nav.skip}
        </a>
        <ThemeSync />
        <Analytics />
        <Nav lang={lang} nav={dict.nav} theme={dict.theme} />
        {/* The page is an opaque sheet above the footer, which waits pinned underneath and is uncovered at the end. */}
        <main
          id="main"
          className="relative z-10 rounded-b-[2.5rem] bg-paper pb-24 shadow-[0_40px_80px_-40px_rgb(var(--shade)/0.45)] md:rounded-b-[3.5rem] md:pb-32"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[58rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent_95%)]"
          >
            <HeroGlow />
          </div>
          {children}
        </main>
        <Footer lang={lang} dict={dict} />
      </body>
    </html>
  );
}
