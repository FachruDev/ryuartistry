import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { disciplineClay } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { formatDate, isLocale, pick } from "@/lib/i18n";
import { getPostBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";

const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs("posts");
  return (slugs.length ? slugs : [PLACEHOLDER]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/lab/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const title = pick(post.title, lang);
  return {
    title,
    description: pick(post.excerpt, lang) || undefined,
    alternates: alternates(lang, `/lab/${slug}`),
    openGraph: {
      type: "article",
      title,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.cover ? [{ url: post.cover.url }] : undefined,
    },
  };
}

export default function PostPage({ params }: PageProps<"/[lang]/lab/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ViewTransition enter="content-in" default="none">
        <PostDetail params={params} />
      </ViewTransition>
    </Suspense>
  );
}

async function PostDetail({ params }: Pick<PageProps<"/[lang]/lab/[slug]">, "params">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const dict = getDictionary(lang);
  const title = pick(post.title, lang);
  const clay = disciplineClay[post.category?.slug ?? ""] ?? "var(--sky)";
  const body = renderRichText(post.body[lang] ?? post.body[lang === "id" ? "en" : "id"]);

  return (
    <article>
      <header className="relative isolate overflow-hidden px-4 pb-14 pt-36 sm:px-8 md:pt-44">
        <div aria-hidden className="morph-blob pointer-events-none absolute -right-24 -top-16 -z-10 size-[28rem] opacity-50 blur-3xl" style={{ background: clay }} />
        <div className="mx-auto max-w-[66ch]">
          <Link
            href={`/${lang}/lab`}
            transitionTypes={["nav-back"]}
            className="group inline-flex items-center gap-2 rounded-full bg-cloud/80 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-plum ring-1 ring-plum/[0.07]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-plum text-milk transition-transform duration-500 group-hover:-translate-x-0.5">
              <ArrowLeft weight="light" className="size-3.5" />
            </span>
            {dict.lab.back}
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-medium text-plum-soft">
            {post.category && (
              <span className="clay rounded-full px-3 py-1 text-xs font-bold text-plum" style={{ ["--clay" as string]: clay }}>
                {pick(post.category.name, lang)}
              </span>
            )}
            <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt, lang)}</time>
            <span>
              {post.readingTime} {dict.lab.minRead}
            </span>
            {post.author?.name && <span>{post.author.name}</span>}
          </div>
          <h1 className="display mt-6 text-[clamp(2.4rem,5.6vw,4.6rem)] text-plum">{title}</h1>
          {pick(post.excerpt, lang) && <p className="mt-6 text-xl leading-relaxed text-plum-soft">{pick(post.excerpt, lang)}</p>}
        </div>
      </header>

      {post.cover && (
        <Reveal className="mx-auto max-w-[1100px] px-4 sm:px-8">
          <div className="bezel">
            <div className="bezel-core relative aspect-[16/9]">
              <Image src={post.cover.url} alt={pick(post.cover.alt, lang) || title} fill priority sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover" />
            </div>
          </div>
        </Reveal>
      )}

      <Reveal className="px-4 py-20 sm:px-8 md:py-24">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
      </Reveal>
    </article>
  );
}
