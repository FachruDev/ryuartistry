import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { formatDate, isLocale, pick } from "@/lib/i18n";
import { getPostBySlug, getPublishedSlugs } from "@/lib/queries";
import { renderRichText } from "@/lib/render";
import { alternates } from "@/lib/site";

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
    <Suspense fallback={<div className="min-h-[60vh] bg-ink" />}>
      <PostDetail params={params} />
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
  const body = renderRichText(post.body[lang] ?? post.body[lang === "id" ? "en" : "id"]);
  const meta = [
    formatDate(post.publishedAt, lang),
    post.category ? pick(post.category.name, lang) : null,
    `${post.readingTime} ${dict.lab.minRead}`,
  ].filter(Boolean);

  return (
    <article>
      <header className="bg-ink px-4 pb-16 pt-36 text-paper sm:px-8 md:pt-44">
        <div className="mx-auto max-w-[68ch]">
          <Link href={`/${lang}/lab`} className="text-sm text-paper/70 hover:text-scale">
            ← {dict.lab.back}
          </Link>
          <h1 className="mt-8 text-[clamp(2.2rem,5.5vw,4.25rem)] font-bold leading-[1.05] tracking-tight">{title}</h1>
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-paper/65">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
            {post.author?.name && <span>{post.author.name}</span>}
          </p>
        </div>
      </header>
      {post.cover && (
        <div className="mx-auto -mb-6 max-w-[1100px] px-4 pt-12 sm:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-sm">
            <Image src={post.cover.url} alt={pick(post.cover.alt, lang) || title} fill priority sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="px-4 py-20 sm:px-8 md:py-24">
        <div className="prose-ryu mx-auto" dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </article>
  );
}
