import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getProjectBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { toneFor } from "@/lib/tones";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";
import { ArrowIcon, BackLink, Dotted, Tag } from "@/components/site/ui";
import { CoverFrame } from "@/components/site/work-card";

const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs("projects");
  return (slugs.length ? slugs : [PLACEHOLDER]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  const title = pick(project.title, lang);
  return {
    title,
    description: pick(project.summary, lang) || undefined,
    alternates: alternates(lang, `/work/${slug}`),
    openGraph: { title, images: project.cover ? [{ url: project.cover.url }] : undefined },
  };
}

export default function ProjectPage({ params }: PageProps<"/[lang]/work/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ViewTransition enter="content-in" default="none">
        <ProjectDetail params={params} />
      </ViewTransition>
    </Suspense>
  );
}

async function ProjectDetail({ params }: Pick<PageProps<"/[lang]/work/[slug]">, "params">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const dict = getDictionary(lang);
  const title = pick(project.title, lang);
  const tone = toneFor(project.category?.slug);
  const body = renderRichText(project.body[lang] ?? project.body[lang === "id" ? "en" : "id"]);
  const facts = [
    { label: dict.work.client, value: project.client },
    { label: dict.work.year, value: project.year?.toString() },
    { label: dict.work.stack, value: project.techStack.join(", ") },
  ].filter((f) => f.value);

  return (
    <article>
      <header className="px-4 pb-12 pt-32 text-center sm:px-8 md:pb-16 md:pt-44">
        <BackLink href={`/${lang}/work`}>{dict.work.back}</BackLink>
        {project.category && (
          <p className="mt-8">
            <Tag tone={tone}>{pick(project.category.name, lang)}</Tag>
          </p>
        )}
        <h1 className="display mx-auto mt-5 max-w-[16ch] text-[clamp(2.8rem,7.4vw,6.4rem)] text-ink">
          <Dotted text={title} />
        </h1>
        {pick(project.summary, lang) && (
          <p className="mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-muted sm:text-xl">{pick(project.summary, lang)}</p>
        )}
      </header>

      <div className="px-4 sm:px-8">
        <div className="relative mx-auto h-[24rem] max-w-[1240px] overflow-hidden rounded-[2.5rem] sm:h-[34rem] md:h-[44rem] md:rounded-[3.5rem]" style={{ background: tone }}>
          <div className="absolute inset-x-[6%] bottom-0 top-10 md:top-16">
            <CoverFrame
              slug={project.slug}
              src={project.cover?.url}
              alt={pick(project.cover?.alt, lang) || title}
              sizes="(min-width: 1240px) 1100px, 90vw"
              priority
            />
          </div>
        </div>
      </div>

      {(facts.length > 0 || project.links.length > 0) && (
        <Reveal className="px-4 sm:px-8">
          <dl className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-8 border-b border-line py-10 md:grid-cols-4 md:py-14">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-sm text-muted">{f.label}</dt>
                <dd className="mt-1.5 font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
            {project.links.length > 0 && (
              <div>
                <dt className="text-sm text-muted">{dict.work.links}</dt>
                <dd className="mt-1.5 space-y-1">
                  {project.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 font-semibold text-ink">
                      <span className="link-grow">{l.label}</span>
                      <ArrowIcon direction="up-right" className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Reveal>
      )}

      {body && (
        <Reveal className="px-4 py-16 sm:px-8 md:py-24">
          <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
        </Reveal>
      )}

      {project.galleryMedia.length > 0 && (
        <div className="mx-auto grid max-w-[1240px] gap-5 px-4 pb-8 sm:px-8 md:grid-cols-2 md:gap-6">
          {project.galleryMedia.map((m, i) => (
            <Reveal key={m.id} delay={(i % 2) * 0.08} className={i % 3 === 0 ? "md:col-span-2" : ""}>
              <div className={`relative overflow-hidden rounded-[2rem] bg-paper-raised md:rounded-[2.75rem] ${i % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
                <Image
                  src={m.url}
                  alt={pick(m.alt, lang) || title}
                  fill
                  sizes={i % 3 === 0 ? "(min-width: 1240px) 1240px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
                  className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03]"
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {project.next && (
        <section className="px-4 pt-16 sm:px-8 md:pt-24">
          <Link
            href={`/${lang}/work/${project.next.slug}`}
            transitionTypes={["nav-forward"]}
            className="lift group mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-6 rounded-[2.5rem] bg-ink px-7 py-12 text-paper md:rounded-[3.5rem] md:px-12 md:py-16"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-60">{dict.work.next}</p>
              <p className="display mt-3 text-[clamp(2.2rem,5.6vw,4.6rem)]">{pick(project.next.title, lang)}</p>
            </div>
            <span className="grid size-14 place-items-center rounded-full bg-paper text-ink transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45 group-hover:scale-110">
              <ArrowIcon className="size-5" />
            </span>
          </Link>
        </section>
      )}
    </article>
  );
}
