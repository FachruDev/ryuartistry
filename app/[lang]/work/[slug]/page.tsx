import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { getProjectBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { ParallaxImage } from "@/components/site/parallax-image";

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
    <Suspense fallback={<div className="min-h-[70vh] bg-ink" />}>
      <ProjectDetail params={params} />
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
  const body = renderRichText(project.body[lang] ?? project.body[lang === "id" ? "en" : "id"]);
  const facts = [
    { label: dict.work.client, value: project.client },
    { label: dict.work.year, value: project.year?.toString() },
    { label: dict.work.stack, value: project.techStack.join(", ") },
  ].filter((f) => f.value);

  return (
    <article>
      <header className="bg-ink px-4 pb-16 pt-36 text-paper sm:px-8 md:pt-44">
        <div className="mx-auto max-w-[1440px]">
          <Link href={`/${lang}/work`} className="text-sm text-paper/70 hover:text-scale">
            ← {dict.work.back}
          </Link>
          {project.category && <p className="mt-8 font-semibold text-scale">{pick(project.category.name, lang)}</p>}
          <h1 className="display mt-3 max-w-[18ch] text-[clamp(2.8rem,8vw,7.5rem)]">{title}</h1>
          {pick(project.summary, lang) && (
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-paper/80 sm:text-xl">{pick(project.summary, lang)}</p>
          )}
          {(facts.length > 0 || project.links.length > 0) && (
            <dl className="mt-12 grid gap-6 border-t border-paper/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-sm text-paper/60">{f.label}</dt>
                  <dd className="mt-1 font-semibold">{f.value}</dd>
                </div>
              ))}
              {project.links.length > 0 && (
                <div>
                  <dt className="text-sm text-paper/60">{dict.work.links}</dt>
                  <dd className="mt-1 space-y-1">
                    {project.links.map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="block font-semibold text-scale hover:underline">
                        {l.label}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      {project.cover && (
        <div className="relative aspect-[16/9] max-h-[85vh] w-full bg-ink">
          <Image
            src={project.cover.url}
            alt={pick(project.cover.alt, lang) || title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {body && (
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 md:py-28">
          <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      )}

      {project.galleryMedia.length > 0 && (
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-24 sm:px-8 md:grid-cols-2">
          {project.galleryMedia.map((m, i) => (
            <ParallaxImage
              key={m.id}
              src={m.url}
              alt={pick(m.alt, lang) || title}
              sizes="(min-width: 768px) 50vw, 100vw"
              className={`rounded-sm ${i % 3 === 0 ? "aspect-[16/9] md:col-span-2" : "aspect-[4/5]"}`}
            />
          ))}
        </div>
      )}

      {project.next && <NextProject lang={lang} label={dict.work.next} next={project.next} />}
    </article>
  );
}

function NextProject({ lang, label, next }: { lang: Locale; label: string; next: { slug: string; title: { id: string; en: string } } }) {
  return (
    <Link href={`/${lang}/work/${next.slug}`} className="group block bg-paper-raised px-4 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-muted">{label}</p>
        <p className="display mt-3 text-[clamp(2.4rem,7vw,6.5rem)] text-ink transition-[font-variation-settings] duration-500 [--wdth:85] group-hover:[--wdth:100]">
          {pick(next.title, lang)}
        </p>
      </div>
    </Link>
  );
}
