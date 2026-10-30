import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getOpenJobs } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { Reveal } from "@/components/site/reveal";
import { ArrowIcon, ButtonLink } from "@/components/site/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/careers">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.careers.eyebrow, description: dict.careers.intro, alternates: alternates(lang, "/careers") };
}

const chip = "rounded-full bg-paper px-3 py-1 text-sm font-medium text-muted ring-1 ring-line";

export default async function CareersPage({ params }: PageProps<"/[lang]/careers">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const jobs = await getOpenJobs();

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.careers.eyebrow} title={dict.careers.title} intro={dict.careers.intro} />
      <section className="mx-auto max-w-[1000px] px-4 sm:px-8">
        {jobs.length === 0 ? (
          <Reveal className="rounded-[2.5rem] bg-paper-raised/70 p-8 text-center ring-1 ring-line sm:p-14">
            <p className="mx-auto max-w-[40ch] text-xl leading-relaxed text-ink">{dict.careers.empty}</p>
            <div className="mt-8">
              <ButtonLink href={`/${lang}/contact?type=career`}>{dict.careers.sayHello}</ButtonLink>
            </div>
          </Reveal>
        ) : (
          <ul className="space-y-3">
            {jobs.map((j, i) => (
              <li key={j.id}>
                <Reveal delay={i * 0.06}>
                  <Link
                    href={`/${lang}/careers/${j.slug}`}
                    transitionTypes={["nav-forward"]}
                    className="lift group flex flex-wrap items-center justify-between gap-6 rounded-[2rem] bg-paper-raised/70 p-6 ring-1 ring-line hover:bg-paper-raised sm:p-10 md:rounded-[2.5rem]"
                  >
                    <div>
                      <h2 className="display text-[clamp(1.8rem,3.4vw,2.8rem)] text-ink">{pick(j.title, lang)}</h2>
                      {pick(j.summary, lang) && <p className="mt-2 max-w-[56ch] text-muted">{pick(j.summary, lang)}</p>}
                      <p className="mt-4 flex flex-wrap gap-2">
                        <span className={chip}>{j.location}</span>
                        <span className={chip}>{j.employmentType}</span>
                      </p>
                    </div>
                    <span className="grid size-12 place-items-center rounded-full bg-ink text-paper transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45 group-hover:scale-110">
                      <ArrowIcon className="size-4" />
                    </span>
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
