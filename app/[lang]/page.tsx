import Link from "next/link";
import { notFound } from "next/navigation";
import { toPostRow, toWorkCard } from "@/lib/cards";
import { disciplineClay } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getFeaturedProjects, getPosts, getServices, getSettings } from "@/lib/queries";
import { Hero } from "@/components/site/hero";
import { Marquee } from "@/components/site/marquee";
import { Manifesto } from "@/components/site/manifesto";
import { ProcessStory } from "@/components/site/process-story";
import { Disciplines } from "@/components/site/disciplines";
import { WorkList } from "@/components/site/work-list";
import { PostList } from "@/components/site/post-list";
import { PageTransition } from "@/components/site/page-transition";
import { Reveal } from "@/components/site/reveal";
import { Eyebrow, PillLink } from "@/components/site/pill";

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
    clay: disciplineClay[d.key],
    image: `/visuals/${d.key}.jpg`,
    services: services.filter((s) => s.icon === d.key).map((s) => pick(s.title, lang)),
    href: `/${lang}/work?category=${d.key}`,
    linkLabel: lang === "id" ? `Karya ${d.title}` : `${d.title} work`,
  }));

  return (
    <PageTransition>
      <Hero
        eyebrow={dict.home.eyebrow}
        lead={customTitle || dict.home.heroLead}
        words={customTitle ? [] : dict.home.heroWords}
        tail={customTitle ? "" : dict.home.heroTail}
        subtitle={pick(settings?.heroSubtitle, lang) || dict.home.heroSubtitle}
        primary={{ href: `/${lang}/work`, label: dict.home.ctaPrimary }}
        secondary={{ href: `/${lang}/contact`, label: dict.home.ctaSecondary }}
        scrollLabel={dict.home.scroll}
        nowShaping={dict.home.nowShaping}
      />

      <Marquee items={dict.home.marquee} label={dict.home.disciplinesEyebrow} />

      <Manifesto text={dict.home.manifesto} />

      <ProcessStory eyebrow={dict.home.storyEyebrow} title={dict.home.storyTitle} steps={dict.home.steps} />

      <Disciplines
        eyebrow={dict.home.disciplinesEyebrow}
        heading={dict.home.disciplinesTitle}
        toggleLabel={dict.home.servicesToggle}
        panels={panels}
      />

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-8 md:py-40">
          <Reveal className="mb-16 flex flex-wrap items-end justify-between gap-6 md:mb-24">
            <div>
              <Eyebrow clay="var(--peach)">{dict.home.featuredEyebrow}</Eyebrow>
              <h2 className="display mt-5 max-w-[13ch] text-[clamp(2.6rem,6vw,5.5rem)] text-plum">{dict.home.featuredTitle}</h2>
            </div>
            <PillLink href={`/${lang}/work`} variant="ghost">
              {dict.home.allWork}
            </PillLink>
          </Reveal>
          <WorkList items={featured.map(toWorkCard)} lang={lang} cursorLabel={dict.cursor.view} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-28 sm:px-8 md:pb-40 lg:grid-cols-[0.8fr_1.6fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <Eyebrow clay="var(--sky)">{dict.home.labEyebrow}</Eyebrow>
              <h2 className="display mt-5 max-w-[11ch] text-[clamp(2.4rem,4.6vw,4.4rem)] text-plum">{dict.home.labTitle}</h2>
              <div className="mt-8">
                <PillLink href={`/${lang}/lab`} variant="ghost">
                  {dict.home.allLab}
                </PillLink>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <PostList items={posts.map(toPostRow)} lang={lang} minRead={dict.lab.minRead} cursorLabel={dict.cursor.read} />
          </Reveal>
        </section>
      )}

      <section className="px-4 pb-28 sm:px-8 md:pb-40">
        <Reveal className="mx-auto max-w-[1400px]">
          <div className="clay relative overflow-hidden px-6 py-16 sm:px-14 sm:py-24" style={{ ["--clay" as string]: "var(--butter)", borderRadius: "3rem" }}>
            <div aria-hidden className="clay morph-blob absolute -right-16 -top-16 size-64 sm:size-80" style={{ ["--clay" as string]: "var(--peach)" }} />
            <div aria-hidden className="clay absolute bottom-10 right-[22%] hidden size-16 rounded-full md:block" style={{ ["--clay" as string]: "var(--mint)" }} />
            <div className="relative">
              <h2 className="display max-w-[16ch] text-[clamp(2.6rem,6.4vw,6.2rem)] text-plum">{dict.home.ctaTitle}</h2>
              <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-plum/75">{dict.home.ctaBody}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <PillLink href={`/${lang}/contact`} size="lg">
                  {dict.home.ctaSecondary}
                </PillLink>
                <Link
                  href={`/${lang}/services`}
                  className="rounded-full px-6 py-4 text-lg font-semibold text-plum ring-1 ring-plum/15 transition-colors duration-500 hover:bg-plum/[0.05]"
                >
                  {dict.nav.services}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}
