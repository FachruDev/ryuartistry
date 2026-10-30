import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { formatDate, isLocale, pick } from "@/lib/i18n";
import { getPostBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";
import { toneFor } from "@/lib/tones";
import { Reveal } from "@/components/site/reveal";
import { DetailSkeleton } from "@/components/site/skeletons";
import { BackLink, Tag } from "@/components/site/ui";

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
  const tone = toneFor(post.category?.slug, "var(--mizu)");
  const body = renderRichText(post.body[lang] ?? post.body[lang === "id" ? "en" : "id"]);

  return (
    <article>
      <header className="px-4 pb-12 pt-32 text-center sm:px-8 md:pb-16 md:pt-44">
        <BackLink href={`/${lang}/lab`}>{dict.lab.back}</BackLink>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted">
          {post.category && <Tag tone={tone}>{pick(post.category.name, lang)}</Tag>}
          <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt, lang)}</time>
          <span aria-hidden>·</span>
          <span>
            {post.readingTime} {dict.lab.minRead}
          </span>
          {post.author?.name && (
            <>
              <span aria-hidden>·</span>
              <span>{post.author.name}</span>
            </>
          )}
        </div>
        <h1 className="display mx-auto mt-6 max-w-[18ch] text-[clamp(2.4rem,6vw,4.8rem)] text-ink">{title}</h1>
        {pick(post.excerpt, lang) && <p className="mx-auto mt-6 max-w-[56ch] text-lg leading-relaxed text-muted sm:text-xl">{pick(post.excerpt, lang)}</p>}
      </header>

      {post.cover && (
        <Reveal className="mx-auto max-w-[1100px] px-4 sm:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] md:rounded-[3rem]" style={{ background: tone }}>
            <Image src={post.cover.url} alt={pick(post.cover.alt, lang) || title} fill priority sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover" />
          </div>
        </Reveal>
      )}

      <Reveal className="px-4 pt-16 sm:px-8 md:pt-24">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
      </Reveal>
    </article>
  );
}
