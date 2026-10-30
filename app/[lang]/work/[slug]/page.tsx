import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/ssr";
import { disciplineClay } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getProjectBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { ParallaxImage } from "@/components/site/parallax-image";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";

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
  const clay = disciplineClay[project.category?.slug ?? ""] ?? "var(--butter)";
  const body = renderRichText(project.body[lang] ?? project.body[lang === "id" ? "en" : "id"]);
  const facts = [
    { label: dict.work.client, value: project.client },
    { label: dict.work.year, value: project.year?.toString() },
    { label: dict.work.stack, value: project.techStack.join(", ") },
  ].filter((f) => f.value);

  return (
    <article>
      <header className="relative isolate overflow-hidden px-4 pb-16 pt-32 sm:px-8 lg:pt-40">
        <div aria-hidden className="morph-blob pointer-events-none absolute -left-32 top-10 -z-10 size-[34rem] opacity-50 blur-3xl" style={{ background: clay }} />
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <div>
            <Link
              href={`/${lang}/work`}
              transitionTypes={["nav-back"]}
              className="group inline-flex items-center gap-2 rounded-full bg-cloud/80 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-plum ring-1 ring-plum/[0.07]"
            >
              <span className="grid size-7 place-items-center rounded-full bg-plum text-milk transition-transform duration-500 group-hover:-translate-x-0.5">
                <ArrowLeft weight="light" className="size-3.5" />
              </span>
              {dict.work.back}
            </Link>
            {project.category && (
              <p className="mt-8">
                <span className="clay rounded-full px-4 py-1.5 text-sm font-bold text-plum" style={{ ["--clay" as string]: clay }}>
                  {pick(project.category.name, lang)}
                </span>
              </p>
            )}
            <h1 className="display mt-6 text-[clamp(2.8rem,6.6vw,6.4rem)] text-plum">{title}</h1>
            {pick(project.summary, lang) && (
              <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-plum-soft sm:text-xl">{pick(project.summary, lang)}</p>
            )}
            {(facts.length > 0 || project.links.length > 0) && (
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 rounded-[1.75rem] bg-cloud/70 p-6 ring-1 ring-plum/[0.06]">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-semibold text-plum-soft">{f.label}</dt>
                    <dd className="mt-1 font-semibold text-plum">{f.value}</dd>
                  </div>
                ))}
                {project.links.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold text-plum-soft">{dict.work.links}</dt>
                    <dd className="mt-1 space-y-1">
                      {project.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 font-semibold text-plum underline decoration-[var(--berry)] decoration-2 underline-offset-4"
                        >
                          {l.label}
                          <ArrowUpRight weight="light" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className="bezel">
            <ViewTransition name={`work-${project.slug}`} share="morph" default="none">
              <div className="bezel-core relative aspect-[4/5] bg-milk-deep sm:aspect-[5/4] lg:aspect-[4/5]">
                {project.cover ? (
                  <Image
                    src={project.cover.url}
                    alt={pick(project.cover.alt, lang) || title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="clay absolute inset-0 rounded-none" style={{ ["--clay" as string]: clay }} />
                )}
              </div>
            </ViewTransition>
          </div>
        </div>
      </header>

      {body && (
        <Reveal className="px-4 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1400px] lg:grid lg:grid-cols-[1fr_2fr] lg:gap-16">
            <p className="display-italic mb-8 text-3xl text-plum-soft lg:sticky lg:top-32 lg:self-start">{dict.work.overview}</p>
            <div className="prose-ryu" dangerouslySetInnerHTML={{ __html: body }} />
          </div>
        </Reveal>
      )}

      {project.galleryMedia.length > 0 && (
        <div className="mx-auto max-w-[1400px] columns-1 gap-6 px-4 pb-24 sm:px-8 md:columns-2">
          {project.galleryMedia.map((m, i) => (
            <Reveal key={m.id} delay={(i % 2) * 0.1} className="mb-6 break-inside-avoid">
              <div className="bezel">
                <div className="bezel-core">
                  <ParallaxImage
                    src={m.url}
                    alt={pick(m.alt, lang) || title}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={i % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {project.next && (
        <section className="px-4 pb-28 sm:px-8">
          <Link
            href={`/${lang}/work/${project.next.slug}`}
            transitionTypes={["nav-forward"]}
            data-cursor={dict.cursor.view}
            className="clay group mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-6 py-14 sm:px-12 sm:py-20"
            style={{ ["--clay" as string]: "var(--lilac)", borderRadius: "3rem" }}
          >
            <div>
              <p className="font-semibold text-plum/70">{dict.work.next}</p>
              <p className="display mt-3 text-[clamp(2.4rem,6vw,5.6rem)] text-plum transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-2">
                {pick(project.next.title, lang)}
              </p>
            </div>
            <span className="grid size-16 place-items-center rounded-full bg-plum text-milk transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:scale-110">
              <ArrowUpRight weight="light" className="size-7" />
            </span>
          </Link>
        </section>
      )}
    </article>
  );
}
