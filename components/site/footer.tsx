import Link from "next/link";
import { cacheLife } from "next/cache";
import type { Dictionary } from "@/lib/dictionaries";
import { pick, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { ThemeSwitch } from "./theme-toggle";

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
  ];

  return (
    <footer className="px-4 pb-10 pt-24 sm:px-8 md:pt-32">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col gap-12 border-t border-line pt-14 lg:flex-row lg:justify-between">
          <div>
            <Link href={`/${lang}`} className="display text-[2rem] text-ink">
              ryuartistry<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 max-w-[30ch] leading-relaxed text-muted">{pick(settings?.tagline, lang) || dict.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16 lg:gap-20">
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

            <div>
              <p className={heading}>{dict.footer.contact}</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href={`/${lang}/contact`} className={item}>
                    {dict.nav.contact}
                  </Link>
                </li>
                {settings?.contactEmail && (
                  <li>
                    <a href={`mailto:${settings.contactEmail}`} className={`${item} break-words`}>
                      {settings.contactEmail}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
          <p className="text-center text-sm text-muted">
            © {year} Ryuartistry <span aria-hidden>•</span> {dict.footer.madeWith}
          </p>
          <ThemeSwitch labels={dict.theme} />
        </div>
      </div>
    </footer>
  );
}
