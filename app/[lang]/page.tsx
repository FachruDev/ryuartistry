import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getFeaturedProjects, getPosts, getServices, getSettings } from "@/lib/queries";
import { Hero } from "@/components/site/hero";
import { Manifesto } from "@/components/site/manifesto";
import { Disciplines } from "@/components/site/disciplines";
import { WorkList } from "@/components/site/work-list";
import { PostList } from "@/components/site/post-list";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [settings, featured, posts, services] = await Promise.all([
    getSettings(),
    getFeaturedProjects(4),
    getPosts(3),
    getServices(),
  ]);

  const panels = dict.disciplines.map((d) => ({
    ...d,
    services: services.filter((s) => s.icon === d.key).map((s) => pick(s.title, lang)),
    href: `/${lang}/work?category=${d.key}`,
    linkLabel: lang === "id" ? `Lihat karya ${d.title}` : `See ${d.title} work`,
  }));

  return (
    <>
      <Hero
        title={pick(settings?.heroTitle, lang) || dict.home.heroTitle}
        subtitle={pick(settings?.heroSubtitle, lang) || dict.home.heroSubtitle}
        primary={{ href: `/${lang}/work`, label: dict.home.ctaPrimary }}
        secondary={{ href: `/${lang}/contact`, label: dict.home.ctaSecondary }}
        scrollLabel={dict.home.scroll}
      />

      <Manifesto text={dict.home.manifesto} />

      <Disciplines heading={dict.home.disciplinesTitle} panels={panels} />

      {featured.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-28 sm:px-8 md:py-40">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6 md:mb-24">
            <h2 className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.5rem)] text-ink">{dict.home.featuredTitle}</h2>
            <Link href={`/${lang}/work`} className="font-semibold text-ink underline decoration-scale decoration-2 underline-offset-4">
              {dict.home.allWork}
            </Link>
          </div>
          <WorkList items={featured} lang={lang} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-8 md:pb-40">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{dict.home.labTitle}</h2>
            <Link href={`/${lang}/lab`} className="font-semibold text-ink underline decoration-scale decoration-2 underline-offset-4">
              {dict.home.allLab}
            </Link>
          </div>
          <PostList items={posts} lang={lang} minRead={dict.lab.minRead} />
        </section>
      )}

      <section className="bg-ink px-4 py-28 text-paper sm:px-8 md:py-40">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="display max-w-[16ch] text-[clamp(2.8rem,7vw,7rem)]">{dict.home.ctaTitle}</h2>
          <p className="mt-6 max-w-[48ch] text-lg text-paper/80">{dict.home.ctaBody}</p>
          <Link
            href={`/${lang}/contact`}
            className="mt-10 inline-flex rounded-full bg-scale px-7 py-3.5 text-lg font-bold text-ink-deep transition-transform hover:-translate-y-0.5"
          >
            {dict.home.ctaSecondary}
          </Link>
        </div>
      </section>
    </>
  );
}
