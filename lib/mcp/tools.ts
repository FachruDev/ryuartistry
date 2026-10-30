import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { generateJSON } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import { db, schema } from "@/lib/db";
import type { Localized, LocalizedDoc } from "@/lib/db/schema";
import { tags } from "@/lib/cache-tags";
import { richTextExtensions } from "@/lib/tiptap";
import { renderRichText } from "@/lib/render";
import { isUniqueViolation, readingTime, slugify } from "@/lib/forms";
import { logActivity, titleOf, type Actor, type Entity } from "@/lib/activity";
import { getAnalytics } from "@/lib/analytics";
import { getContentHealth } from "@/lib/cms-health";
import { deletePublic, uploadPublic } from "@/lib/storage";

export class ToolError extends Error {}

type Ctx = { actor: Actor };
type Annotations = { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean };

export type ToolDef = {
  name: string;
  title: string;
  description: string;
  input: z.ZodObject;
  annotations?: Annotations;
  run: (args: never, ctx: Ctx) => Promise<unknown>;
};

function defineTool<S extends z.ZodObject>(def: {
  name: string;
  title: string;
  description: string;
  input: S;
  annotations?: Annotations;
  run: (args: z.infer<S>, ctx: Ctx) => Promise<unknown>;
}): ToolDef {
  return def as unknown as ToolDef;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugInput = z.string().regex(SLUG, "huruf kecil, angka, dan tanda hubung").max(80);
const localizedInput = z
  .object({ id: z.string().describe("Bahasa Indonesia"), en: z.string().describe("English") })
  .partial()
  .describe("Teks dua bahasa. Bahasa yang tidak dikirim tetap seperti sebelumnya.");
const htmlInput = z
  .object({ id: z.string(), en: z.string() })
  .partial()
  .describe(
    "Isi artikel dalam HTML sederhana per bahasa: <p>, <h2>, <h3>, <ul>/<ol>/<li>, <blockquote>, <pre><code>, <a href>, <strong>, <em>, <img src alt>, <hr>.",
  );
const linksInput = z.array(z.object({ label: z.string(), url: z.url() }));
const statusInput = z.enum(["draft", "published"]).describe("draft tidak tampil di situs; published langsung tampil.");

function mergeLocalized(current: Localized | undefined, patch: Partial<Localized> | undefined): Localized {
  return { id: patch?.id?.trim() ?? current?.id ?? "", en: patch?.en?.trim() ?? current?.en ?? "" };
}

function htmlToDoc(html: string): JSONContent | null {
  return html.trim() ? (generateJSON(html, richTextExtensions) as JSONContent) : null;
}

function mergeDoc(current: LocalizedDoc | undefined, patch: Partial<Localized>): LocalizedDoc {
  return {
    id: patch.id !== undefined ? htmlToDoc(patch.id) : (current?.id ?? null),
    en: patch.en !== undefined ? htmlToDoc(patch.en) : (current?.en ?? null),
  };
}

function docToHtml(doc: LocalizedDoc) {
  return { id: renderRichText(doc.id), en: renderRichText(doc.en) };
}

/** Drops undefined keys so partial updates only touch what was sent. */
function defined<T extends Record<string, unknown>>(values: T): Partial<T> {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function checkTitle(title: Localized, slug: string) {
  if (!title.id && !title.en) throw new ToolError("Judul wajib diisi minimal dalam satu bahasa.");
  if (!SLUG.test(slug)) throw new ToolError(`Slug "${slug}" tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.`);
}

async function resolveCategory(value: string | null | undefined, kind: "project" | "post") {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const [row] = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.kind, kind),
        z.uuid().safeParse(value).success ? eq(schema.categories.id, value) : eq(schema.categories.slug, value),
      ),
    );
  if (!row) throw new ToolError(`Kategori "${value}" untuk ${kind} tidak ditemukan. Lihat daftar kategori di cms_overview.`);
  return row.id;
}

async function assertMedia(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => !!id);
  if (!wanted.length) return;
  const rows = await db.select({ id: schema.media.id }).from(schema.media).where(inArray(schema.media.id, wanted));
  const missing = wanted.filter((id) => !rows.some((r) => r.id === id));
  if (missing.length) throw new ToolError(`Media tidak ditemukan: ${missing.join(", ")}. Unggah dulu dengan upload_media_from_url.`);
}

// Route Handlers cannot use updateTag; expire immediately so the next visitor sees the change.
function invalidate(...names: (keyof typeof tags)[]) {
  for (const name of names) revalidateTag(tags[name], { expire: 0 });
}

async function guardSlug<T>(entity: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) throw new ToolError(`Slug sudah dipakai ${entity} lain. Pilih slug berbeda.`);
    throw error;
  }
}

const publishedAtFor = (status: string | undefined, current: Date | null | undefined) =>
  current ?? (status === "published" ? new Date() : null);

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

const contentType = z.enum(["project", "post", "service", "team", "category", "media", "inquiry"]);

const overview = defineTool({
  name: "cms_overview",
  title: "Ringkasan CMS",
  description:
    "Mulai dari sini. Jumlah konten per jenis, daftar kategori (slug dan id), pengaturan situs, konten yang perlu diperbaiki, dan aktivitas terbaru.",
  input: z.object({}),
  annotations: { readOnlyHint: true },
  run: async () => {
    const statusCount = (table: typeof schema.projects | typeof schema.posts) =>
      db
        .select({ status: table.status, count: sql<number>`count(*)`.mapWith(Number) })
        .from(table)
        .groupBy(table.status);
    const [projects, posts, services, team, media, inbox, categories, [settings], health, activity] = await Promise.all([
      statusCount(schema.projects),
      statusCount(schema.posts),
      db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.services),
      db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.teamMembers),
      db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.media),
      db
        .select({ status: schema.inquiries.status, count: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.inquiries)
        .groupBy(schema.inquiries.status),
      db.select().from(schema.categories).orderBy(asc(schema.categories.kind), asc(schema.categories.sortOrder)),
      db.select().from(schema.siteSettings),
      getContentHealth(),
      db.select().from(schema.activityLog).orderBy(desc(schema.activityLog.createdAt)).limit(10),
    ]);
    const byStatus = (rows: { status: string; count: number }[]) => Object.fromEntries(rows.map((r) => [r.status, r.count]));
    return {
      counts: {
        projects: byStatus(projects),
        posts: byStatus(posts),
        services: services[0].count,
        team: team[0].count,
        media: media[0].count,
        inquiries: byStatus(inbox),
      },
      categories: categories.map((c) => ({ id: c.id, slug: c.slug, kind: c.kind, name: c.name })),
      settings: settings ?? null,
      health: health.map((h) => ({ severity: h.severity, issue: h.text, items: h.items.map((i) => i.title) })),
      recentActivity: activity.map((a) => ({
        at: a.createdAt,
        who: `${a.actorName} (${a.actorType})`,
        action: a.action,
        entity: a.entity,
        label: a.label,
      })),
    };
  },
});

const listContent = defineTool({
  name: "list_content",
  title: "Daftar konten",
  description: "Daftar ringkas konten satu jenis, bisa difilter status dan kata kunci. Gunakan get_content untuk isi lengkap.",
  input: z.object({
    type: contentType,
    status: z.string().optional().describe("project/post: draft | published. inquiry: new | read | archived."),
    query: z.string().optional().describe("Cari di judul, slug, nama, atau email."),
    limit: z.number().int().min(1).max(200).default(50),
  }),
  annotations: { readOnlyHint: true },
  run: async ({ type, status, query, limit }) => {
    const like = query ? `%${query.replace(/[%_\\]/g, "\\$&")}%` : null;
    const titleLike = (t: typeof schema.projects | typeof schema.posts | typeof schema.services) =>
      like ? or(sql`${t.title}::text ilike ${like}`, ilike(t.slug, like)) : undefined;

    switch (type) {
      case "project": {
        const rows = await db.query.projects.findMany({
          where: and(
            status === "draft" || status === "published" ? eq(schema.projects.status, status) : undefined,
            titleLike(schema.projects),
          ),
          with: { category: { columns: { slug: true } } },
          orderBy: [asc(schema.projects.sortOrder), desc(schema.projects.updatedAt)],
          limit,
        });
        return rows.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          featured: p.featured,
          category: p.category?.slug ?? null,
          year: p.year,
          hasCover: !!p.coverId,
          updatedAt: p.updatedAt,
        }));
      }
      case "post": {
        const rows = await db.query.posts.findMany({
          where: and(status === "draft" || status === "published" ? eq(schema.posts.status, status) : undefined, titleLike(schema.posts)),
          with: { category: { columns: { slug: true } } },
          orderBy: [desc(schema.posts.updatedAt)],
          limit,
        });
        return rows.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          category: p.category?.slug ?? null,
          readingTime: p.readingTime,
          publishedAt: p.publishedAt,
          hasCover: !!p.coverId,
        }));
      }
      case "service":
        return db
          .select({ id: schema.services.id, slug: schema.services.slug, title: schema.services.title, icon: schema.services.icon, sortOrder: schema.services.sortOrder })
          .from(schema.services)
          .where(titleLike(schema.services))
          .orderBy(asc(schema.services.sortOrder))
          .limit(limit);
      case "team":
        return db
          .select({ id: schema.teamMembers.id, name: schema.teamMembers.name, role: schema.teamMembers.role, sortOrder: schema.teamMembers.sortOrder })
          .from(schema.teamMembers)
          .where(like ? ilike(schema.teamMembers.name, like) : undefined)
          .orderBy(asc(schema.teamMembers.sortOrder))
          .limit(limit);
      case "category":
        return db.select().from(schema.categories).orderBy(asc(schema.categories.kind), asc(schema.categories.sortOrder)).limit(limit);
      case "media":
        return db
          .select({ id: schema.media.id, url: schema.media.url, alt: schema.media.alt, mime: schema.media.mime, createdAt: schema.media.createdAt })
          .from(schema.media)
          .where(like ? ilike(schema.media.key, like) : undefined)
          .orderBy(desc(schema.media.createdAt))
          .limit(limit);
      case "inquiry": {
        const rows = await db
          .select()
          .from(schema.inquiries)
          .where(
            and(
              status === "new" || status === "read" || status === "archived" ? eq(schema.inquiries.status, status) : undefined,
              like ? or(ilike(schema.inquiries.name, like), ilike(schema.inquiries.email, like), ilike(schema.inquiries.message, like)) : undefined,
            ),
          )
          .orderBy(desc(schema.inquiries.createdAt))
          .limit(limit);
        return rows.map((m) => ({ ...m, message: m.message.length > 240 ? `${m.message.slice(0, 240)}…` : m.message }));
      }
    }
  },
});

const getContent = defineTool({
  name: "get_content",
  title: "Isi lengkap konten",
  description: "Isi lengkap satu konten berdasarkan id atau slug. Isi artikel dikembalikan sebagai HTML per bahasa (bodyHtml).",
  input: z.object({
    type: contentType,
    id: z.string().optional(),
    slug: z.string().optional(),
  }),
  annotations: { readOnlyHint: true },
  run: async ({ type, id, slug }) => {
    if (!id && !slug) throw new ToolError("Kirim id atau slug.");
    const notFound = () => new ToolError(`Konten ${type} dengan ${id ? `id ${id}` : `slug ${slug}`} tidak ditemukan.`);
    const isUuid = !!id && z.uuid().safeParse(id).success;
    if (id && !isUuid) throw notFound();

    switch (type) {
      case "project": {
        const p = await db.query.projects.findFirst({
          where: id ? eq(schema.projects.id, id) : eq(schema.projects.slug, slug!),
          with: { cover: true, category: true },
        });
        if (!p) throw notFound();
        const gallery = p.gallery.length ? await db.select().from(schema.media).where(inArray(schema.media.id, p.gallery)) : [];
        const { body, ...rest } = p;
        return { ...rest, bodyHtml: docToHtml(body), galleryMedia: gallery, publicUrl: `/id/work/${p.slug}` };
      }
      case "post": {
        const p = await db.query.posts.findFirst({
          where: id ? eq(schema.posts.id, id) : eq(schema.posts.slug, slug!),
          with: { cover: true, category: true },
        });
        if (!p) throw notFound();
        const { body, ...rest } = p;
        return { ...rest, bodyHtml: docToHtml(body), publicUrl: `/id/lab/${p.slug}` };
      }
      case "service": {
        const [row] = await db.select().from(schema.services).where(id ? eq(schema.services.id, id) : eq(schema.services.slug, slug!));
        if (!row) throw notFound();
        return row;
      }
      case "category": {
        const [row] = await db.select().from(schema.categories).where(id ? eq(schema.categories.id, id) : eq(schema.categories.slug, slug!));
        if (!row) throw notFound();
        return row;
      }
      case "team": {
        if (!id) throw new ToolError("Anggota tim dicari dengan id.");
        const row = await db.query.teamMembers.findFirst({ where: eq(schema.teamMembers.id, id), with: { photo: true } });
        if (!row) throw notFound();
        return row;
      }
      case "media": {
        if (!id) throw new ToolError("Media dicari dengan id.");
        const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id));
        if (!row) throw notFound();
        return row;
      }
      case "inquiry": {
        if (!id) throw new ToolError("Pesan dicari dengan id.");
        const [row] = await db.select().from(schema.inquiries).where(eq(schema.inquiries.id, id));
        if (!row) throw notFound();
        return row;
      }
    }
  },
});

const analytics = defineTool({
  name: "get_analytics",
  title: "Analitik kunjungan",
  description:
    "Laporan kunjungan situs: total vs periode sebelumnya, tren harian, halaman teratas, sumber, negara, perangkat, jam ramai (WIB), konten yang belum dikunjungi, dan wawasan otomatis.",
  input: z.object({ range: z.enum(["7d", "30d", "90d"]).default("30d") }),
  annotations: { readOnlyHint: true },
  run: ({ range }) => getAnalytics(range),
});

// ---------------------------------------------------------------------------
// Write tools
// ---------------------------------------------------------------------------

const saveProject = defineTool({
  name: "save_project",
  title: "Buat / ubah karya",
  description:
    "Membuat karya portofolio baru (tanpa id) atau memperbarui sebagian karya yang ada (dengan id). Field yang tidak dikirim tidak berubah. Default status draft.",
  input: z.object({
    id: z.uuid().optional().describe("Isi untuk memperbarui; kosongkan untuk membuat baru."),
    slug: slugInput.optional().describe("Bagian URL. Otomatis dari judul jika kosong."),
    title: localizedInput.optional(),
    summary: localizedInput.optional().describe("1–2 kalimat untuk kartu karya."),
    bodyHtml: htmlInput.optional().describe("Studi kasus dalam HTML per bahasa."),
    coverId: z.uuid().nullable().optional().describe("id media untuk gambar sampul."),
    gallery: z.array(z.uuid()).optional().describe("Daftar id media galeri, berurutan."),
    category: z.string().nullable().optional().describe("Slug kategori karya (ai, game, software, creative) atau id-nya."),
    tags: z.array(z.string()).optional(),
    techStack: z.array(z.string()).optional(),
    client: z.string().nullable().optional(),
    year: z.number().int().min(1990).max(2100).nullable().optional(),
    links: linksInput.optional(),
    featured: z.boolean().optional().describe("Tampilkan di beranda."),
    sortOrder: z.number().int().optional().describe("Angka kecil tampil lebih dulu."),
    status: statusInput.optional(),
  }),
  run: async (args, { actor }) => {
    const existing = args.id ? await db.query.projects.findFirst({ where: eq(schema.projects.id, args.id) }) : undefined;
    if (args.id && !existing) throw new ToolError(`Karya ${args.id} tidak ditemukan.`);
    const title = mergeLocalized(existing?.title, args.title);
    const slug = args.slug ?? existing?.slug ?? slugify(title.en || title.id);
    checkTitle(title, slug);
    await assertMedia([args.coverId, ...(args.gallery ?? [])]);

    const status = args.status ?? existing?.status ?? "draft";
    const values = {
      slug,
      title,
      status,
      publishedAt: publishedAtFor(status, existing?.publishedAt),
      ...defined({
        summary: args.summary && mergeLocalized(existing?.summary, args.summary),
        body: args.bodyHtml && mergeDoc(existing?.body, args.bodyHtml),
        coverId: args.coverId,
        gallery: args.gallery,
        categoryId: await resolveCategory(args.category, "project"),
        tags: args.tags,
        techStack: args.techStack,
        client: args.client,
        year: args.year,
        links: args.links,
        featured: args.featured,
        sortOrder: args.sortOrder,
      }),
    };
    const id = await guardSlug("karya", async () => {
      if (existing) {
        await db.update(schema.projects).set(values).where(eq(schema.projects.id, existing.id));
        return existing.id;
      }
      const [row] = await db.insert(schema.projects).values(values).returning({ id: schema.projects.id });
      return row.id;
    });
    await logActivity(actor, existing ? "update" : "create", "project", id, titleOf(title));
    invalidate("projects");
    return { id, slug, status, publicUrl: `/id/work/${slug}`, adminUrl: `/admin/projects/${id}` };
  },
});

const savePost = defineTool({
  name: "save_post",
  title: "Buat / ubah catatan Lab",
  description:
    "Membuat catatan Lab (artikel/devlog) baru tanpa id, atau memperbarui sebagian dengan id. Waktu baca dihitung otomatis. Default status draft.",
  input: z.object({
    id: z.uuid().optional(),
    slug: slugInput.optional(),
    title: localizedInput.optional(),
    excerpt: localizedInput.optional().describe("Ringkasan 1–2 kalimat."),
    bodyHtml: htmlInput.optional(),
    coverId: z.uuid().nullable().optional(),
    category: z.string().nullable().optional().describe("Slug kategori Lab (lab-ai, lab-game, lab-software, lab-creative) atau id-nya."),
    tags: z.array(z.string()).optional(),
    status: statusInput.optional(),
  }),
  run: async (args, { actor }) => {
    const existing = args.id ? await db.query.posts.findFirst({ where: eq(schema.posts.id, args.id) }) : undefined;
    if (args.id && !existing) throw new ToolError(`Catatan ${args.id} tidak ditemukan.`);
    const title = mergeLocalized(existing?.title, args.title);
    const slug = args.slug ?? existing?.slug ?? slugify(title.en || title.id);
    checkTitle(title, slug);
    await assertMedia([args.coverId]);

    const body = args.bodyHtml ? mergeDoc(existing?.body, args.bodyHtml) : undefined;
    const status = args.status ?? existing?.status ?? "draft";
    const values = {
      slug,
      title,
      status,
      publishedAt: publishedAtFor(status, existing?.publishedAt),
      ...defined({
        excerpt: args.excerpt && mergeLocalized(existing?.excerpt, args.excerpt),
        body,
        readingTime: body ? Math.max(readingTime(body.id), readingTime(body.en)) : undefined,
        coverId: args.coverId,
        categoryId: await resolveCategory(args.category, "post"),
        tags: args.tags,
      }),
    };
    const id = await guardSlug("catatan", async () => {
      if (existing) {
        await db.update(schema.posts).set(values).where(eq(schema.posts.id, existing.id));
        return existing.id;
      }
      const [row] = await db.insert(schema.posts).values(values).returning({ id: schema.posts.id });
      return row.id;
    });
    await logActivity(actor, existing ? "update" : "create", "post", id, titleOf(title));
    invalidate("posts");
    return { id, slug, status, publicUrl: `/id/lab/${slug}`, adminUrl: `/admin/posts/${id}` };
  },
});

const saveService = defineTool({
  name: "save_service",
  title: "Buat / ubah layanan",
  description: "Membuat layanan baru tanpa id, atau memperbarui sebagian dengan id.",
  input: z.object({
    id: z.uuid().optional(),
    slug: slugInput.optional(),
    title: localizedInput.optional(),
    description: localizedInput.optional(),
    icon: z.string().nullable().optional().describe("Kunci ikon: ai, game, software, creative."),
    sortOrder: z.number().int().optional(),
  }),
  run: async (args, { actor }) => {
    const [existing] = args.id ? await db.select().from(schema.services).where(eq(schema.services.id, args.id)) : [];
    if (args.id && !existing) throw new ToolError(`Layanan ${args.id} tidak ditemukan.`);
    const title = mergeLocalized(existing?.title, args.title);
    const slug = args.slug ?? existing?.slug ?? slugify(title.en || title.id);
    checkTitle(title, slug);
    const values = {
      slug,
      title,
      ...defined({
        description: args.description && mergeLocalized(existing?.description, args.description),
        icon: args.icon,
        sortOrder: args.sortOrder,
      }),
    };
    const id = await guardSlug("layanan", async () => {
      if (existing) {
        await db.update(schema.services).set(values).where(eq(schema.services.id, existing.id));
        return existing.id;
      }
      const [row] = await db.insert(schema.services).values(values).returning({ id: schema.services.id });
      return row.id;
    });
    await logActivity(actor, existing ? "update" : "create", "service", id, titleOf(title));
    invalidate("services");
    return { id, slug };
  },
});

const saveTeamMember = defineTool({
  name: "save_team_member",
  title: "Buat / ubah anggota tim",
  description: "Menambah anggota tim tanpa id, atau memperbarui sebagian dengan id.",
  input: z.object({
    id: z.uuid().optional(),
    name: z.string().min(1).optional(),
    role: localizedInput.optional(),
    bio: localizedInput.optional(),
    photoId: z.uuid().nullable().optional(),
    socials: linksInput.optional(),
    sortOrder: z.number().int().optional(),
  }),
  run: async (args, { actor }) => {
    const [existing] = args.id ? await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, args.id)) : [];
    if (args.id && !existing) throw new ToolError(`Anggota tim ${args.id} tidak ditemukan.`);
    const name = args.name?.trim() ?? existing?.name;
    if (!name) throw new ToolError("Nama wajib diisi.");
    await assertMedia([args.photoId]);
    const values = {
      name,
      ...defined({
        role: args.role && mergeLocalized(existing?.role, args.role),
        bio: args.bio && mergeLocalized(existing?.bio, args.bio),
        photoId: args.photoId,
        socials: args.socials,
        sortOrder: args.sortOrder,
      }),
    };
    let id = existing?.id;
    if (existing) {
      await db.update(schema.teamMembers).set(values).where(eq(schema.teamMembers.id, existing.id));
    } else {
      [{ id }] = await db.insert(schema.teamMembers).values(values).returning({ id: schema.teamMembers.id });
    }
    await logActivity(actor, existing ? "update" : "create", "team", id!, name);
    invalidate("team");
    return { id, name };
  },
});

const saveCategory = defineTool({
  name: "save_category",
  title: "Buat / ubah kategori",
  description: "Membuat kategori baru tanpa id, atau memperbarui dengan id. kind: project (karya) atau post (Lab).",
  input: z.object({
    id: z.uuid().optional(),
    slug: slugInput.optional(),
    name: localizedInput.optional(),
    kind: z.enum(["project", "post"]).optional(),
    sortOrder: z.number().int().optional(),
  }),
  run: async (args, { actor }) => {
    const [existing] = args.id ? await db.select().from(schema.categories).where(eq(schema.categories.id, args.id)) : [];
    if (args.id && !existing) throw new ToolError(`Kategori ${args.id} tidak ditemukan.`);
    const name = mergeLocalized(existing?.name, args.name);
    const slug = args.slug ?? existing?.slug ?? slugify(name.en || name.id);
    checkTitle(name, slug);
    const kind = args.kind ?? existing?.kind;
    if (!kind) throw new ToolError("kind wajib diisi untuk kategori baru: project atau post.");
    const values = { slug, name, kind, ...defined({ sortOrder: args.sortOrder }) };
    const id = await guardSlug("kategori", async () => {
      if (existing) {
        await db.update(schema.categories).set(values).where(eq(schema.categories.id, existing.id));
        return existing.id;
      }
      const [row] = await db.insert(schema.categories).values(values).returning({ id: schema.categories.id });
      return row.id;
    });
    await logActivity(actor, existing ? "update" : "create", "category", id, titleOf(name));
    invalidate("categories", "projects", "posts");
    return { id, slug, kind };
  },
});

const updateSettings = defineTool({
  name: "update_site_settings",
  title: "Ubah pengaturan situs",
  description: "Memperbarui teks hero, tagline, email kontak, atau tautan sosial. Field yang tidak dikirim tidak berubah.",
  input: z.object({
    tagline: localizedInput.optional(),
    heroTitle: localizedInput.optional(),
    heroSubtitle: localizedInput.optional(),
    contactEmail: z.email().nullable().optional(),
    socials: linksInput.optional(),
  }),
  run: async (args, { actor }) => {
    const [current] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
    const values = defined({
      tagline: args.tagline && mergeLocalized(current?.tagline, args.tagline),
      heroTitle: args.heroTitle && mergeLocalized(current?.heroTitle, args.heroTitle),
      heroSubtitle: args.heroSubtitle && mergeLocalized(current?.heroSubtitle, args.heroSubtitle),
      contactEmail: args.contactEmail,
      socials: args.socials,
    });
    if (!Object.keys(values).length) throw new ToolError("Tidak ada field yang diubah.");
    await db.insert(schema.siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: schema.siteSettings.id, set: values });
    await logActivity(actor, "update", "settings", "1", "Pengaturan situs");
    invalidate("settings");
    return { updated: Object.keys(values) };
  },
});

const ALLOWED_IMAGES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const uploadMedia = defineTool({
  name: "upload_media_from_url",
  title: "Unggah gambar dari URL",
  description:
    "Mengunduh gambar dari URL publik (JPG, PNG, WebP, AVIF, GIF, maks 8 MB) ke penyimpanan media CMS. Kembalikan id media untuk coverId/gallery/photoId. Pastikan gambar boleh dipakai (lisensi).",
  input: z.object({
    url: z.url().describe("URL http(s) gambar."),
    alt: localizedInput.optional().describe("Teks alternatif yang menjelaskan isi gambar."),
    filename: z.string().optional().describe("Nama file yang mudah dibaca, tanpa ekstensi."),
  }),
  run: async ({ url, alt, filename }, { actor }) => {
    const target = new URL(url);
    // Token holders are trusted editors, but keep the server from fetching its own network.
    if (!/^https?:$/.test(target.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(target.hostname)) {
      throw new ToolError("Hanya URL publik http(s) yang diizinkan.");
    }
    const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new ToolError(`Gagal mengunduh gambar (HTTP ${res.status}).`);
    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = ALLOWED_IMAGES[mime];
    if (!ext) throw new ToolError(`Tipe file ${mime || "tidak dikenal"} tidak didukung.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new ToolError("Gambar lebih dari 8 MB.");

    const base = slugify(filename ?? target.pathname.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "") || "image";
    const now = new Date();
    const key = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;
    const publicUrl = await uploadPublic(key, bytes, mime);
    const [row] = await db
      .insert(schema.media)
      .values({ key, url: publicUrl, mime, size: bytes.byteLength, alt: mergeLocalized(undefined, alt) })
      .returning();
    await logActivity(actor, "create", "media", row.id, base);
    return { id: row.id, url: row.url, alt: row.alt };
  },
});

const updateMediaAlt = defineTool({
  name: "update_media_alt",
  title: "Ubah teks alt gambar",
  description: "Mengisi atau mengubah teks alternatif (alt) gambar untuk aksesibilitas dan SEO.",
  input: z.object({ id: z.uuid(), alt: localizedInput }),
  annotations: { idempotentHint: true },
  run: async ({ id, alt }, { actor }) => {
    const [current] = await db.select().from(schema.media).where(eq(schema.media.id, id));
    if (!current) throw new ToolError(`Media ${id} tidak ditemukan.`);
    const next = mergeLocalized(current.alt, alt);
    await db.update(schema.media).set({ alt: next }).where(eq(schema.media.id, id));
    await logActivity(actor, "update", "media", id, current.key.split("/").pop() ?? current.key);
    invalidate("projects", "posts", "team");
    return { id, alt: next };
  },
});

const setInquiryStatus = defineTool({
  name: "set_inquiry_status",
  title: "Ubah status pesan",
  description: "Menandai pesan inbox sebagai new, read, atau archived.",
  input: z.object({ id: z.uuid(), status: z.enum(["new", "read", "archived"]) }),
  annotations: { idempotentHint: true },
  run: async ({ id, status }) => {
    const [row] = await db.update(schema.inquiries).set({ status }).where(eq(schema.inquiries.id, id)).returning({ id: schema.inquiries.id });
    if (!row) throw new ToolError(`Pesan ${id} tidak ditemukan.`);
    return { id, status };
  },
});

const deleteTables = {
  project: { table: schema.projects, tag: "projects", label: (r: { title: Localized }) => titleOf(r.title) },
  post: { table: schema.posts, tag: "posts", label: (r: { title: Localized }) => titleOf(r.title) },
  service: { table: schema.services, tag: "services", label: (r: { title: Localized }) => titleOf(r.title) },
  team: { table: schema.teamMembers, tag: "team", label: (r: { name: string }) => r.name },
  category: { table: schema.categories, tag: "categories", label: (r: { name: Localized }) => titleOf(r.name) },
} as const;

const deleteContent = defineTool({
  name: "delete_content",
  title: "Hapus konten",
  description:
    "Menghapus satu konten secara permanen. Tidak bisa dibatalkan. Konfirmasikan dulu dengan pengguna; untuk menyembunyikan karya/catatan, lebih baik ubah status menjadi draft.",
  input: z.object({ type: contentType, id: z.uuid() }),
  annotations: { destructiveHint: true },
  run: async ({ type, id }, { actor }) => {
    if (type === "media") {
      const [row] = await db.delete(schema.media).where(eq(schema.media.id, id)).returning();
      if (!row) throw new ToolError(`Media ${id} tidak ditemukan.`);
      await deletePublic(row.key);
      await logActivity(actor, "delete", "media", id, row.key.split("/").pop() ?? row.key);
      invalidate("projects", "posts", "team");
      return { deleted: id };
    }
    if (type === "inquiry") {
      const [row] = await db.delete(schema.inquiries).where(eq(schema.inquiries.id, id)).returning();
      if (!row) throw new ToolError(`Pesan ${id} tidak ditemukan.`);
      await logActivity(actor, "delete", "inquiry", id, row.name);
      return { deleted: id };
    }
    const target = deleteTables[type];
    const [row] = (await db.delete(target.table).where(eq(target.table.id, id)).returning()) as Record<string, unknown>[];
    if (!row) throw new ToolError(`${type} ${id} tidak ditemukan.`);
    await logActivity(actor, "delete", type as Entity, id, (target.label as (r: unknown) => string)(row));
    invalidate(target.tag);
    return { deleted: id };
  },
});

export const tools: ToolDef[] = [
  overview,
  listContent,
  getContent,
  analytics,
  saveProject,
  savePost,
  saveService,
  saveTeamMember,
  saveCategory,
  updateSettings,
  uploadMedia,
  updateMediaAlt,
  setInquiryStatus,
  deleteContent,
];
