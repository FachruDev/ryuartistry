import type { Category, Localized, Media, Post, Project } from "@/lib/db/schema";

/** Only what a Lab row renders. */
export type PostRow = Pick<Post, "id" | "slug" | "title" | "excerpt" | "publishedAt" | "readingTime"> & {
  cover: { url: string } | null;
  category: { slug: string; name: Localized } | null;
};

export function toPostRow(p: Post & { cover: Media | null; category: Category | null }): PostRow {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    readingTime: p.readingTime,
    cover: p.cover && { url: p.cover.url },
    category: p.category && { slug: p.category.slug, name: p.category.name },
  };
}

/** Only what a work card renders, so case-study bodies stay out of client payloads. */
export type WorkCard = Pick<Project, "id" | "slug" | "title" | "summary" | "year" | "categoryId"> & {
  cover: Pick<Media, "url" | "alt"> | null;
  category: Pick<Category, "slug" | "name"> | null;
};

export function toWorkCard(p: Project & { cover: Media | null; category: Category | null }): WorkCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    year: p.year,
    categoryId: p.categoryId,
    cover: p.cover && { url: p.cover.url, alt: p.cover.alt },
    category: p.category && { slug: p.category.slug, name: p.category.name },
  };
}
