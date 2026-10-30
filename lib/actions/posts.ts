"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import {
  isUniqueViolation,
  list,
  localized,
  localizedDoc,
  optionalStr,
  readingTime,
  slugify,
  str,
  type FormState,
} from "@/lib/forms";
import { checkBasics } from "./validate";
import { logActivity, titleOf } from "@/lib/activity";

export async function savePost(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const title = localized(form, "title");
  const slug = str(form, "slug") || slugify(title.en || title.id);
  const fieldErrors = checkBasics({ slug, title });
  if (fieldErrors) return { fieldErrors, error: "Periksa kembali isian yang ditandai." };

  const body = localizedDoc(form, "body");
  const status = str(form, "status") === "published" ? "published" : "draft";
  const values = {
    slug,
    title,
    excerpt: localized(form, "excerpt"),
    body,
    coverId: optionalStr(form, "coverId"),
    categoryId: optionalStr(form, "categoryId"),
    tags: list(form, "tags"),
    readingTime: Math.max(readingTime(body.id), readingTime(body.en)),
    status,
  } as const;

  let savedId = id;
  try {
    if (id) {
      const [current] = await db
        .select({ publishedAt: schema.posts.publishedAt })
        .from(schema.posts)
        .where(eq(schema.posts.id, id));
      await db
        .update(schema.posts)
        .set({ ...values, publishedAt: current?.publishedAt ?? (status === "published" ? new Date() : null) })
        .where(eq(schema.posts.id, id));
    } else {
      const [row] = await db
        .insert(schema.posts)
        .values({ ...values, authorId: user.id, publishedAt: status === "published" ? new Date() : null })
        .returning({ id: schema.posts.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Slug ini sudah dipakai catatan lain." } };
    throw error;
  }

  await logActivity({ type: "user", name: user.name }, id ? "update" : "create", "post", savedId, titleOf(title));
  updateTag(tags.posts);
  if (!id) redirect(`/admin/posts/${savedId}`);
  return { ok: true };
}

export async function deletePost(id: string) {
  const user = await requireUser();
  const [row] = await db.delete(schema.posts).where(eq(schema.posts.id, id)).returning({ title: schema.posts.title });
  if (row) await logActivity({ type: "user", name: user.name }, "delete", "post", id, titleOf(row.title));
  updateTag(tags.posts);
  redirect("/admin/posts");
}
