"use server";

import { desc, ilike, or, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export type SearchHit = { href: string; title: string; kind: string; status?: string };

/** Command palette search across the CMS. */
export async function searchCms(query: string): Promise<SearchHit[]> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const titled = (table: typeof schema.projects | typeof schema.posts | typeof schema.services) =>
    or(sql`${table.title}->>'id' ilike ${like}`, sql`${table.title}->>'en' ilike ${like}`, ilike(table.slug, like));

  const [projects, posts, services, team, inbox] = await Promise.all([
    db
      .select({ id: schema.projects.id, title: schema.projects.title, status: schema.projects.status })
      .from(schema.projects)
      .where(titled(schema.projects))
      .orderBy(desc(schema.projects.updatedAt))
      .limit(5),
    db
      .select({ id: schema.posts.id, title: schema.posts.title, status: schema.posts.status })
      .from(schema.posts)
      .where(titled(schema.posts))
      .orderBy(desc(schema.posts.updatedAt))
      .limit(5),
    db
      .select({ id: schema.services.id, title: schema.services.title })
      .from(schema.services)
      .where(titled(schema.services))
      .limit(3),
    db
      .select({ id: schema.teamMembers.id, name: schema.teamMembers.name })
      .from(schema.teamMembers)
      .where(ilike(schema.teamMembers.name, like))
      .limit(3),
    db
      .select({ name: schema.inquiries.name, email: schema.inquiries.email })
      .from(schema.inquiries)
      .where(or(ilike(schema.inquiries.name, like), ilike(schema.inquiries.email, like), ilike(schema.inquiries.company, like)))
      .orderBy(desc(schema.inquiries.createdAt))
      .limit(3),
  ]);

  const name = (t: { id: string; en: string }) => t.id || t.en || "(tanpa judul)";
  return [
    ...projects.map((p) => ({ href: `/admin/projects/${p.id}`, title: name(p.title), kind: "Karya", status: p.status })),
    ...posts.map((p) => ({ href: `/admin/posts/${p.id}`, title: name(p.title), kind: "Lab", status: p.status })),
    ...services.map((s) => ({ href: `/admin/services/${s.id}`, title: name(s.title), kind: "Layanan" })),
    ...team.map((t) => ({ href: `/admin/team/${t.id}`, title: t.name, kind: "Tim" })),
    ...inbox.map((m) => ({ href: "/admin/inbox", title: `${m.name} · ${m.email}`, kind: "Inbox" })),
  ];
}
