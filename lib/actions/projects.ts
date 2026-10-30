"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import {
  bool,
  idList,
  isUniqueViolation,
  links,
  list,
  localized,
  localizedDoc,
  int,
  optionalInt,
  optionalStr,
  slugify,
  str,
  type FormState,
} from "@/lib/forms";
import { checkBasics } from "./validate";
import { logActivity, titleOf } from "@/lib/activity";

export async function saveProject(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const title = localized(form, "title");
  const slug = str(form, "slug") || slugify(title.en || title.id);
  const fieldErrors = checkBasics({ slug, title });
  if (fieldErrors) return { fieldErrors, error: "Periksa kembali isian yang ditandai." };

  const status = str(form, "status") === "published" ? "published" : "draft";
  const values = {
    slug,
    title,
    summary: localized(form, "summary"),
    body: localizedDoc(form, "body"),
    coverId: optionalStr(form, "coverId"),
    gallery: idList(form, "gallery"),
    categoryId: optionalStr(form, "categoryId"),
    tags: list(form, "tags"),
    techStack: list(form, "techStack"),
    client: optionalStr(form, "client"),
    year: optionalInt(form, "year"),
    links: links(form, "links"),
    featured: bool(form, "featured"),
    sortOrder: int(form, "sortOrder"),
    status,
  } as const;

  let savedId = id;
  try {
    if (id) {
      const [current] = await db
        .select({ publishedAt: schema.projects.publishedAt })
        .from(schema.projects)
        .where(eq(schema.projects.id, id));
      await db
        .update(schema.projects)
        .set({ ...values, publishedAt: current?.publishedAt ?? (status === "published" ? new Date() : null) })
        .where(eq(schema.projects.id, id));
    } else {
      const [row] = await db
        .insert(schema.projects)
        .values({ ...values, publishedAt: status === "published" ? new Date() : null })
        .returning({ id: schema.projects.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Slug ini sudah dipakai karya lain." } };
    throw error;
  }

  await logActivity({ type: "user", name: user.name }, id ? "update" : "create", "project", savedId, titleOf(title));
  updateTag(tags.projects);
  if (!id) redirect(`/admin/projects/${savedId}`);
  return { ok: true };
}

export async function deleteProject(id: string) {
  const user = await requireUser();
  const [row] = await db.delete(schema.projects).where(eq(schema.projects.id, id)).returning({ title: schema.projects.title });
  if (row) await logActivity({ type: "user", name: user.name }, "delete", "project", id, titleOf(row.title));
  updateTag(tags.projects);
  redirect("/admin/projects");
}
