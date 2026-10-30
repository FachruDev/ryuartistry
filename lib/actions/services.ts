"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { int, isUniqueViolation, localized, optionalStr, slugify, str, type FormState } from "@/lib/forms";
import { checkBasics } from "./validate";
import { logActivity, titleOf } from "@/lib/activity";

export async function saveService(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const title = localized(form, "title");
  const slug = str(form, "slug") || slugify(title.en || title.id);
  const fieldErrors = checkBasics({ slug, title });
  if (fieldErrors) return { fieldErrors, error: "Periksa kembali isian yang ditandai." };

  const values = {
    slug,
    title,
    description: localized(form, "description"),
    icon: optionalStr(form, "icon"),
    sortOrder: int(form, "sortOrder"),
  };

  let savedId = id;
  try {
    if (id) {
      await db.update(schema.services).set(values).where(eq(schema.services.id, id));
    } else {
      const [row] = await db.insert(schema.services).values(values).returning({ id: schema.services.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Slug ini sudah dipakai layanan lain." } };
    throw error;
  }

  await logActivity({ type: "user", name: user.name }, id ? "update" : "create", "service", savedId, titleOf(title));
  updateTag(tags.services);
  if (!id) redirect("/admin/services");
  return { ok: true };
}

export async function deleteService(id: string) {
  const user = await requireUser();
  const [row] = await db.delete(schema.services).where(eq(schema.services.id, id)).returning({ title: schema.services.title });
  if (row) await logActivity({ type: "user", name: user.name }, "delete", "service", id, titleOf(row.title));
  updateTag(tags.services);
  redirect("/admin/services");
}
