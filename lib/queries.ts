import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";

// Public reads. CMS content only changes when an editor saves, so entries live
// as long as possible and are expired by `updateTag` in the admin actions.

const published = <T extends typeof schema.projects | typeof schema.posts>(table: T) =>
  eq(table.status, "published");

export async function getSettings() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.settings);
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
  return row ?? null;
}

export async function getProjects() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projects);
  return db.query.projects.findMany({
    where: published(schema.projects),
    with: { cover: true, category: true },
    orderBy: [asc(schema.projects.sortOrder), desc(schema.projects.publishedAt)],
  });
}

export async function getFeaturedProjects(limit = 4) {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projects);
  const featured = await db.query.projects.findMany({
    where: and(published(schema.projects), eq(schema.projects.featured, true)),
    with: { cover: true, category: true },
    orderBy: [asc(schema.projects.sortOrder), desc(schema.projects.publishedAt)],
    limit,
  });
  if (featured.length) return featured;
  // Before anything is marked as featured, show the latest work instead of an empty section.
  return db.query.projects.findMany({
    where: published(schema.projects),
    with: { cover: true, category: true },
    orderBy: [desc(schema.projects.publishedAt)],
    limit,
  });
}

export async function getProjectBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projects);
  const project = await db.query.projects.findFirst({
    where: and(published(schema.projects), eq(schema.projects.slug, slug)),
    with: { cover: true, category: true },
  });
  if (!project) return null;

  const [galleryRows, all] = await Promise.all([
    project.gallery.length
      ? db.select().from(schema.media).where(inArray(schema.media.id, project.gallery))
      : Promise.resolve([]),
    db
      .select({ slug: schema.projects.slug, title: schema.projects.title })
      .from(schema.projects)
      .where(published(schema.projects))
      .orderBy(asc(schema.projects.sortOrder), desc(schema.projects.publishedAt)),
  ]);
  const gallery = project.gallery
    .map((id) => galleryRows.find((m) => m.id === id))
    .filter((m) => m !== undefined);
  const index = all.findIndex((p) => p.slug === slug);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  return { ...project, galleryMedia: gallery, next };
}

export async function getCategories(kind: "project" | "post") {
  "use cache";
  cacheLife("max");
  cacheTag(tags.categories);
  return db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.kind, kind))
    .orderBy(asc(schema.categories.sortOrder));
}

export async function getPosts(limit?: number) {
  "use cache";
  cacheLife("max");
  cacheTag(tags.posts);
  return db.query.posts.findMany({
    where: published(schema.posts),
    with: { cover: true, category: true },
    orderBy: [desc(schema.posts.publishedAt)],
    limit,
  });
}

export async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(tags.posts);
  const post = await db.query.posts.findFirst({
    where: and(published(schema.posts), eq(schema.posts.slug, slug)),
    with: { cover: true, category: true, author: { columns: { name: true } } },
  });
  return post ?? null;
}

export async function getServices() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.services);
  return db.select().from(schema.services).orderBy(asc(schema.services.sortOrder));
}

export async function getTeam() {
  "use cache";
  cacheLife("max");
  cacheTag(tags.team);
  return db.query.teamMembers.findMany({
    with: { photo: true },
    orderBy: [asc(schema.teamMembers.sortOrder)],
  });
}

/** Slugs to prerender. Cache Components needs at least one entry per dynamic route. */
export async function getPublishedSlugs(kind: "projects" | "posts") {
  "use cache";
  cacheLife("max");
  cacheTag(tags[kind]);
  const rows =
    kind === "projects"
      ? await db.select({ slug: schema.projects.slug }).from(schema.projects).where(published(schema.projects))
      : await db.select({ slug: schema.posts.slug }).from(schema.posts).where(published(schema.posts));
  return rows.map((r) => r.slug);
}
