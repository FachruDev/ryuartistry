import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getServices } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { toneFor } from "@/lib/tones";
import { CtaCard } from "@/components/site/cta-card";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
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
      <PageIntro eyebrow={dict.services.eyebrow} title={dict.services.title} intro={dict.services.intro} />
      <section className="mx-auto max-w-[1000px] px-4 pb-12 sm:px-8">
        {services.length === 0 ? (
          <p className="text-center text-lg text-muted">{dict.services.empty}</p>
        ) : (
          <Reveal>
            <ServiceAccordion
              items={services.map((s) => ({
                id: s.id,
                title: pick(s.title, lang),
                description: pick(s.description, lang),
                discipline: s.icon ? disciplineName[s.icon] : undefined,
                tone: toneFor(s.icon),
              }))}
            />
          </Reveal>
        )}
      </section>
      <CtaCard title={dict.home.ctaTitle} body={dict.home.ctaBody} primary={{ href: `/${lang}/contact?type=project`, label: dict.home.ctaSecondary }} />
    </PageTransition>
  );
}
