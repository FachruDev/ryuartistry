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

const letterClays = ["var(--lilac)", "var(--peach)", "var(--mint)", "var(--sky)", "var(--butter)"];

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
    <footer className="relative overflow-hidden rounded-t-[3rem] bg-plum px-4 pt-20 text-milk sm:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="display-italic text-3xl leading-tight text-milk">{pick(settings?.tagline, lang) || dict.footer.tagline}</p>
          {settings?.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-6 inline-block text-lg font-semibold text-[var(--butter)] underline decoration-[var(--butter)]/40 decoration-2 underline-offset-4 hover:decoration-[var(--butter)]"
            >
              {settings.contactEmail}
            </a>
          )}
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2.5">
            {nav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-milk/70 transition-colors duration-500 hover:text-milk">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {settings && settings.socials.length > 0 && (
          <ul className="space-y-2.5">
            {settings.socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-milk/70 transition-colors duration-500 hover:text-milk">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p aria-hidden className="display mt-20 select-none whitespace-nowrap text-center text-[clamp(4.5rem,18vw,18rem)] leading-[0.78]">
        {"ryuartistry".split("").map((ch, i) => (
          <span key={i} style={{ color: letterClays[i % letterClays.length] }}>
            {ch}
          </span>
        ))}
      </p>

      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-2 border-t border-milk/10 py-6 text-sm text-milk/55">
        <span>
          © {year} Ryuartistry. {dict.footer.rights}
        </span>
        <span>{dict.footer.madeWith}</span>
      </div>
    </footer>
  );
}
