"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { int, isUniqueViolation, localized, optionalStr, slugify, str, type FormState } from "@/lib/forms";
import { checkBasics } from "./validate";

export async function saveService(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();

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

  try {
    if (id) {
      await db.update(schema.services).set(values).where(eq(schema.services.id, id));
    } else {
      await db.insert(schema.services).values(values);
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Slug ini sudah dipakai layanan lain." } };
    throw error;
  }

  updateTag(tags.services);
  if (!id) redirect("/admin/services");
  return { ok: true };
}

export async function deleteService(id: string) {
  await requireUser();
  await db.delete(schema.services).where(eq(schema.services.id, id));
  updateTag(tags.services);
  redirect("/admin/services");
}
