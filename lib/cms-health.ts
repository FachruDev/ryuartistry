import "server-only";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type HealthIssue = { severity: "warn" | "info"; text: string; href: string; items: { title: string; href: string }[] };

const title = (t: { id: string; en: string }) => t.id || t.en || "(tanpa judul)";
const projectItem = (p: { id: string; title: { id: string; en: string } }) => ({ title: title(p.title), href: `/admin/projects/${p.id}` });
const postItem = (p: { id: string; title: { id: string; en: string } }) => ({ title: title(p.title), href: `/admin/posts/${p.id}` });

/** Checklist of things an editor should fix, used by the dashboard and the AI tools. */
export async function getContentHealth(): Promise<HealthIssue[]> {
  const [projects, posts, media, [settings]] = await Promise.all([
    db
      .select({
        id: schema.projects.id,
        title: schema.projects.title,
        summary: schema.projects.summary,
        coverId: schema.projects.coverId,
        status: schema.projects.status,
        updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects),
    db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        excerpt: schema.posts.excerpt,
        coverId: schema.posts.coverId,
        status: schema.posts.status,
        updatedAt: schema.posts.updatedAt,
      })
      .from(schema.posts),
    db
      .select({ id: schema.media.id, key: schema.media.key })
      .from(schema.media)
      .where(sql`${schema.media.alt}->>'id' = '' and ${schema.media.alt}->>'en' = ''`)
      .orderBy(desc(schema.media.createdAt)),
    db.select().from(schema.siteSettings),
  ]);

  const issues: HealthIssue[] = [];
  const add = (severity: HealthIssue["severity"], text: string, href: string, items: HealthIssue["items"]) => {
    if (items.length) issues.push({ severity, text, href, items });
  };
  const staleBefore = Date.now() - 14 * 24 * 60 * 60 * 1000;

  add(
    "warn",
    "Karya terbit tanpa gambar sampul",
    "/admin/projects",
    projects.filter((p) => p.status === "published" && !p.coverId).map(projectItem),
  );
  add(
    "warn",
    "Karya belum lengkap terjemahannya",
    "/admin/projects",
    projects
      .filter((p) => !p.title.id || !p.title.en || !p.summary.id || !p.summary.en)
      .map(projectItem),
  );
  add(
    "warn",
    "Catatan Lab belum lengkap terjemahannya",
    "/admin/posts",
    posts
      .filter((p) => !p.title.id || !p.title.en || !p.excerpt.id || !p.excerpt.en)
      .map(postItem),
  );
  add(
    "info",
    "Catatan Lab terbit tanpa sampul",
    "/admin/posts",
    posts.filter((p) => p.status === "published" && !p.coverId).map(postItem),
  );
  add(
    "info",
    "Draf yang tidak disentuh lebih dari 2 minggu",
    "/admin/projects",
    [
      ...projects.filter((p) => p.status === "draft" && p.updatedAt.getTime() < staleBefore).map(projectItem),
      ...posts.filter((p) => p.status === "draft" && p.updatedAt.getTime() < staleBefore).map(postItem),
    ],
  );
  add(
    "info",
    "Gambar tanpa teks alternatif (alt)",
    "/admin/media",
    media.map((m) => ({ title: m.key.split("/").pop() ?? m.key, href: "/admin/media" })),
  );
  if (!settings?.contactEmail) {
    issues.push({ severity: "warn", text: "Email kontak situs belum diisi", href: "/admin/settings", items: [] });
  }
  return issues;
}
