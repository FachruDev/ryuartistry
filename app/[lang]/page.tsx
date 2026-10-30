import { notFound } from "next/navigation";
import { toPostRow, toWorkCard } from "@/lib/cards";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getFeaturedProjects, getPosts, getServices, getSettings } from "@/lib/queries";
import { disciplineTone } from "@/lib/tones";
import { CtaCard } from "@/components/site/cta-card";
import { Disciplines } from "@/components/site/disciplines";
import { Hero } from "@/components/site/hero";
import { Manifesto } from "@/components/site/manifesto";
import { PageTransition } from "@/components/site/page-transition";
import { PostList } from "@/components/site/post-list";
import { ProcessSteps } from "@/components/site/process-steps";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink, SectionHeading } from "@/components/site/ui";
import { WorkList } from "@/components/site/work-list";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [settings, featured, posts, services] = await Promise.all([
    getSettings(),
    getFeaturedProjects(4),
    getPosts(4),
    getServices(),
  ]);

  const customTitle = pick(settings?.heroTitle, lang);
  const panels = dict.disciplines.map((d) => ({
    ...d,
    tone: disciplineTone[d.key],
    services: services.filter((s) => s.icon === d.key).map((s) => pick(s.title, lang)),
    href: `/${lang}/work?category=${d.key}`,
  }));

  return (
    <PageTransition>
      <Hero
        lead={dict.home.heroLead}
        words={dict.home.heroWords}
        customTitle={customTitle}
        subtitle={pick(settings?.heroSubtitle, lang) || dict.home.heroSubtitle}
        primary={{ href: `/${lang}/work`, label: dict.home.ctaPrimary }}
        secondary={{ href: `/${lang}/contact`, label: dict.home.ctaSecondary }}
      />

      {featured.length > 0 && (
        <section aria-label={dict.home.featuredTitle} className="px-4 sm:px-8">
          <div className="mx-auto max-w-[1240px]">
            <WorkList items={featured.map(toWorkCard)} lang={lang} />
            <Reveal className="mt-12 flex justify-center">
              <ButtonLink href={`/${lang}/work`} variant="ghost">
                {dict.home.allWork}
              </ButtonLink>
            </Reveal>
          </div>
        </section>
      )}

      <Manifesto text={dict.home.manifesto} />

      <Disciplines title={dict.home.disciplinesTitle} intro={dict.home.disciplinesIntro} linkLabel={dict.home.disciplinesLink} panels={panels} />

      <ProcessSteps title={dict.home.storyTitle} intro={dict.home.storyIntro} steps={dict.home.steps} />

      {posts.length > 0 && (
        <section className="px-4 py-24 sm:px-8 md:py-36">
          <Reveal>
            <SectionHeading title={dict.home.labTitle} intro={dict.home.labIntro} />
          </Reveal>
          <Reveal delay={0.08} className="mx-auto mt-14 max-w-[980px] md:mt-20">
            <PostList items={posts.map(toPostRow)} lang={lang} minRead={dict.lab.minRead} />
            <div className="mt-12 flex justify-center">
              <ButtonLink href={`/${lang}/lab`} variant="ghost">
                {dict.home.allLab}
              </ButtonLink>
            </div>
          </Reveal>
        </section>
      )}

      <CtaCard
        title={dict.home.ctaTitle}
        body={dict.home.ctaBody}
        primary={{ href: `/${lang}/contact`, label: dict.home.ctaSecondary }}
        secondary={{ href: `/${lang}/services`, label: dict.nav.services }}
      />
    </PageTransition>
  );
}
