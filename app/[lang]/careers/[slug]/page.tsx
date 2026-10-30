import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getJobBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { PillLink } from "@/components/site/pill";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";

const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs("jobs");
  return (slugs.length ? slugs : [PLACEHOLDER]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/careers/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const job = await getJobBySlug(slug);
  if (!job) return {};
  return {
    title: pick(job.title, lang),
    description: pick(job.summary, lang) || undefined,
    alternates: alternates(lang, `/careers/${slug}`),
  };
}

export default function JobPage({ params }: PageProps<"/[lang]/careers/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ViewTransition enter="content-in" default="none">
        <JobDetail params={params} />
      </ViewTransition>
    </Suspense>
  );
}

async function JobDetail({ params }: Pick<PageProps<"/[lang]/careers/[slug]">, "params">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const dict = getDictionary(lang);
  const body = renderRichText(job.body[lang] ?? job.body[lang === "id" ? "en" : "id"]);

  return (
    <article>
      <header className="relative isolate overflow-hidden px-4 pb-14 pt-36 sm:px-8 md:pt-44">
        <div aria-hidden className="morph-blob pointer-events-none absolute -right-24 -top-16 -z-10 size-[28rem] bg-[var(--peach)] opacity-50 blur-3xl" />
        <div className="mx-auto max-w-[66ch]">
          <Link
            href={`/${lang}/careers`}
            transitionTypes={["nav-back"]}
            className="group inline-flex items-center gap-2 rounded-full bg-cloud/80 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-plum ring-1 ring-plum/[0.07]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-plum text-milk transition-transform duration-500 group-hover:-translate-x-0.5">
              <ArrowLeft weight="light" className="size-3.5" />
            </span>
            {dict.careers.back}
          </Link>
          <h1 className="display mt-8 text-[clamp(2.4rem,5.6vw,4.6rem)] text-plum">{pick(job.title, lang)}</h1>
          <p className="mt-5 flex flex-wrap gap-2">
            <span className="clay rounded-full px-4 py-1.5 text-sm font-bold text-plum" style={{ ["--clay" as string]: "var(--peach)" }}>
              {job.location}
            </span>
            <span className="clay rounded-full px-4 py-1.5 text-sm font-bold text-plum" style={{ ["--clay" as string]: "var(--butter)" }}>
              {job.employmentType}
            </span>
          </p>
        </div>
      </header>
      <Reveal className="px-4 pb-28 pt-6 sm:px-8">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
        <div className="mx-auto mt-14 max-w-[66ch]">
          <PillLink href={`/${lang}/contact?type=career`} size="lg">
            {dict.careers.apply}
          </PillLink>
        </div>
      </Reveal>
    </article>
  );
}
