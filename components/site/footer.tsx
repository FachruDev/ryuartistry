import Link from "next/link";
import { cacheLife } from "next/cache";
import type { Dictionary } from "@/lib/dictionaries";
import { pick, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { FooterParallax } from "./footer-parallax";
import { ThemeSwitch } from "./theme-toggle";
import { ArrowIcon, ButtonLink, Dotted } from "./ui";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const heading = "text-sm font-semibold text-ink";
const item = "link-grow text-muted hover:text-ink";

export async function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [settings, year] = await Promise.all([getSettings(), currentYear()]);
  const nav = [
    { href: `/${lang}/work`, label: dict.nav.work },
    { href: `/${lang}/lab`, label: dict.nav.lab },
    { href: `/${lang}/services`, label: dict.nav.services },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/contact`, label: dict.nav.contact },
  ];

  return (
    // Tucked under the rounded bottom of <main>; FooterParallax lets its contents trail behind the scroll.
    <FooterParallax className="relative z-0 -mt-16 overflow-hidden bg-paper-raised px-4 pb-8 pt-32 sm:px-8 md:-mt-20 md:pt-40">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col gap-8 border-b border-line pb-14 md:flex-row md:items-end md:justify-between md:pb-16">
          <h2 className="display max-w-[13ch] text-[clamp(2.6rem,6vw,5rem)] text-ink">
            <Dotted text={dict.footer.headline} />
          </h2>
          <div className="flex flex-col items-start gap-5 md:items-end">
            {settings?.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="link-grow break-all text-xl font-semibold text-ink sm:text-2xl">
                {settings.contactEmail}
              </a>
            )}
            <ButtonLink href={`/${lang}/contact`}>{dict.home.ctaSecondary}</ButtonLink>
          </div>
        </div>

        <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <p className="max-w-[32ch] text-lg leading-relaxed text-muted">{pick(settings?.tagline, lang) || dict.footer.tagline}</p>

          <nav aria-label={dict.footer.explore}>
            <p className={heading}>{dict.footer.explore}</p>
            <ul className="mt-4 space-y-3">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={item}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {settings && settings.socials.length > 0 && (
            <div>
              <p className={heading}>{dict.footer.elsewhere}</p>
              <ul className="mt-4 space-y-3">
                {settings.socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className={item}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-6 border-t border-line pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted">
            © {year} Ryuartistry <span aria-hidden>•</span> {dict.footer.madeWith}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ThemeSwitch labels={dict.theme} />
            <a href="#main" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink">
              {dict.footer.backToTop}
              <ArrowIcon direction="up" className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </div>
    </FooterParallax>
  );
}
