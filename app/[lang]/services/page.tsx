import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getServices } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.services.title, description: dict.services.intro, alternates: alternates(lang, "/services") };
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const services = await getServices();
  const disciplineName = Object.fromEntries(dict.disciplines.map((d) => [d.key, d.title]));

  return (
    <>
      <PageIntro title={dict.services.title} intro={dict.services.intro} />
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 md:py-28">
        {services.length === 0 ? (
          <p className="text-lg text-muted">{dict.services.empty}</p>
        ) : (
          <ul className="border-t border-line">
            {services.map((s) => (
              <li key={s.id} className="grid gap-4 border-b border-line py-10 md:grid-cols-[1fr_1.1fr] md:gap-16 md:py-14">
                <div>
                  {s.icon && disciplineName[s.icon] && <p className="font-semibold text-glow">{disciplineName[s.icon]}</p>}
                  <h2 className="display mt-2 text-[clamp(2rem,4.5vw,3.75rem)] text-ink [--wdth:90]">{pick(s.title, lang)}</h2>
                </div>
                <p className="max-w-[52ch] self-end text-lg leading-relaxed text-text/80">{pick(s.description, lang)}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-16 flex flex-wrap items-center gap-6">
          <p className="text-xl font-semibold text-ink">{dict.home.ctaTitle}</p>
          <Link href={`/${lang}/contact`} className="rounded-full bg-ink px-6 py-3 font-bold text-paper hover:bg-ink-deep">
            {dict.home.ctaSecondary}
          </Link>
        </div>
      </section>
    </>
  );
}
