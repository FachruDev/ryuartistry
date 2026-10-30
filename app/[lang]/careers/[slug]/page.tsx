import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getJobBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";
import { BackLink, ButtonLink, Tag } from "@/components/site/ui";

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
      <header className="px-4 pb-12 pt-32 text-center sm:px-8 md:pb-16 md:pt-44">
        <BackLink href={`/${lang}/careers`}>{dict.careers.back}</BackLink>
        <h1 className="display mx-auto mt-8 max-w-[18ch] text-[clamp(2.4rem,6vw,4.8rem)] text-ink">{pick(job.title, lang)}</h1>
        <p className="mt-6 flex flex-wrap justify-center gap-2">
          <Tag tone="var(--peach)">{job.location}</Tag>
          <Tag tone="var(--butter)">{job.employmentType}</Tag>
        </p>
      </header>
      <Reveal className="px-4 sm:px-8">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
        <div className="mx-auto mt-14 max-w-[68ch]">
          <ButtonLink href={`/${lang}/contact?type=career`}>{dict.careers.apply}</ButtonLink>
        </div>
      </Reveal>
    </article>
  );
}
