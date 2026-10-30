import Link from "next/link";
import { cacheLife } from "next/cache";
import type { Dictionary } from "@/lib/dictionaries";
import { pick, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [settings, year] = await Promise.all([getSettings(), currentYear()]);
  const nav = [
    { href: `/${lang}/work`, label: dict.nav.work },
    { href: `/${lang}/lab`, label: dict.nav.lab },
    { href: `/${lang}/services`, label: dict.nav.services },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/careers`, label: dict.nav.careers },
    { href: `/${lang}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="overflow-hidden bg-ink-deep text-paper">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-10 pt-20 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="text-lg leading-snug text-paper/85">{pick(settings?.tagline, lang)}</p>
          {settings?.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="mt-4 inline-block text-scale underline-offset-4 hover:underline">
              {settings.contactEmail}
            </a>
          )}
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2">
            {nav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-paper/75 hover:text-scale">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {settings && settings.socials.length > 0 && (
          <ul className="space-y-2">
            {settings.socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-paper/75 hover:text-scale">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p
        aria-hidden
        className="display select-none whitespace-nowrap px-2 text-center text-[clamp(4rem,17vw,17rem)] leading-[0.8] text-paper/[0.06]"
        style={{ ["--wdth" as string]: 75 }}
      >
        ryuartistry
      </p>
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-2 px-4 py-6 text-sm text-paper/55 sm:px-8">
        <span>
          © {year} Ryuartistry. {dict.footer.rights}
        </span>
        <span>{dict.footer.madeWith}</span>
      </div>
    </footer>
  );
}
