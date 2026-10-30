import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getJobBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";

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
    <Suspense fallback={<div className="min-h-[60vh] bg-ink" />}>
      <JobDetail params={params} />
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
      <header className="bg-ink px-4 pb-16 pt-36 text-paper sm:px-8 md:pt-44">
        <div className="mx-auto max-w-[68ch]">
          <Link href={`/${lang}/careers`} className="text-sm text-paper/70 hover:text-scale">
            ← {dict.careers.back}
          </Link>
          <h1 className="mt-8 text-[clamp(2.2rem,5.5vw,4.25rem)] font-bold leading-[1.05] tracking-tight">{pick(job.title, lang)}</h1>
          <p className="mt-4 text-paper/70">
            {job.location}, {job.employmentType}
          </p>
        </div>
      </header>
      <div className="px-4 py-20 sm:px-8">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
        <div className="mx-auto mt-14 max-w-[68ch]">
          <Link
            href={`/${lang}/contact?type=career`}
            className="inline-flex rounded-full bg-ink px-6 py-3 font-bold text-paper hover:bg-ink-deep"
          >
            {dict.careers.apply}
          </Link>
        </div>
      </div>
    </article>
  );
}
