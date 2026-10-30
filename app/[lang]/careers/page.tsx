import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { clayCycle } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getOpenJobs } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { PillLink } from "@/components/site/pill";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata({ params }: PageProps<"/[lang]/careers">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.careers.eyebrow, description: dict.careers.intro, alternates: alternates(lang, "/careers") };
}

export default async function CareersPage({ params }: PageProps<"/[lang]/careers">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const jobs = await getOpenJobs();

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.careers.eyebrow} title={dict.careers.title} intro={dict.careers.intro} clay="var(--peach)" accent="var(--butter)" />
      <section className="mx-auto max-w-[1100px] px-4 pb-28 sm:px-8 md:pb-40">
        {jobs.length === 0 ? (
          <Reveal className="clay flex flex-wrap items-center justify-between gap-6 p-8 sm:p-12">
            <p className="max-w-[40ch] text-xl leading-relaxed text-plum">{dict.careers.empty}</p>
            <PillLink href={`/${lang}/contact?type=career`}>{dict.nav.letsTalk}</PillLink>
          </Reveal>
        ) : (
          <ul className="space-y-4">
            {jobs.map((j, i) => (
              <li key={j.id}>
                <Reveal delay={i * 0.06}>
                  <Link
                    href={`/${lang}/careers/${j.slug}`}
                    transitionTypes={["nav-forward"]}
                    className="clay clay-press group flex flex-wrap items-center justify-between gap-6 p-6 sm:p-10"
                    style={{ ["--clay" as string]: clayCycle[i % clayCycle.length] }}
                  >
                    <div>
                      <h2 className="display text-[clamp(1.8rem,3.4vw,3rem)] text-plum">{pick(j.title, lang)}</h2>
                      {pick(j.summary, lang) && <p className="mt-2 max-w-[56ch] text-plum/75">{pick(j.summary, lang)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-cloud/70 px-3 py-1 text-sm font-semibold text-plum">{j.location}</span>
                      <span className="rounded-full bg-cloud/70 px-3 py-1 text-sm font-semibold text-plum">{j.employmentType}</span>
                      <span className="grid size-12 place-items-center rounded-full bg-plum text-milk transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-105">
                        <ArrowUpRight weight="light" className="size-5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageTransition>
  );
}
