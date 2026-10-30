import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { disciplineClay } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getServices } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { PillLink } from "@/components/site/pill";
import { Reveal } from "@/components/site/reveal";
import { ServiceAccordion } from "@/components/site/service-accordion";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.services.eyebrow, description: dict.services.intro, alternates: alternates(lang, "/services") };
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const services = await getServices();
  const disciplineName = Object.fromEntries(dict.disciplines.map((d) => [d.key, d.title]));

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.services.eyebrow} title={dict.services.title} intro={dict.services.intro} clay="var(--mint)" accent="var(--sky)" />
      <section className="mx-auto max-w-[1100px] px-4 pb-28 sm:px-8 md:pb-40">
        {services.length === 0 ? (
          <p className="text-lg text-plum-soft">{dict.services.empty}</p>
        ) : (
          <Reveal>
            <ServiceAccordion
              items={services.map((s) => ({
                id: s.id,
                title: pick(s.title, lang),
                description: pick(s.description, lang),
                discipline: s.icon ? disciplineName[s.icon] : undefined,
                clay: disciplineClay[s.icon ?? ""] ?? "var(--butter)",
              }))}
            />
          </Reveal>
        )}
        <Reveal className="mt-20 flex flex-wrap items-center justify-between gap-6">
          <p className="display max-w-[18ch] text-[clamp(1.8rem,3.4vw,3rem)] text-plum">{dict.home.ctaTitle}</p>
          <PillLink href={`/${lang}/contact`} size="lg">
            {dict.home.ctaSecondary}
          </PillLink>
        </Reveal>
      </section>
    </PageTransition>
  );
}
