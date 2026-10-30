"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import {
  bool,
  int,
  isUniqueViolation,
  localized,
  localizedDoc,
  slugify,
  str,
  type FormState,
} from "@/lib/forms";
import { checkBasics } from "./validate";

export async function saveJob(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();

  const title = localized(form, "title");
  const slug = str(form, "slug") || slugify(title.en || title.id);
  const fieldErrors = checkBasics({ slug, title });
  if (fieldErrors) return { fieldErrors, error: "Periksa kembali isian yang ditandai." };

  const values = {
    slug,
    title,
    summary: localized(form, "summary"),
    body: localizedDoc(form, "body"),
    location: str(form, "location") || "Remote",
    employmentType: str(form, "employmentType") || "Full-time",
    isOpen: bool(form, "isOpen"),
    sortOrder: int(form, "sortOrder"),
  };

  let savedId = id;
  try {
    if (id) {
      await db.update(schema.jobs).set(values).where(eq(schema.jobs.id, id));
    } else {
      const [row] = await db.insert(schema.jobs).values(values).returning({ id: schema.jobs.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Slug ini sudah dipakai posisi lain." } };
    throw error;
  }

  updateTag(tags.jobs);
  if (!id) redirect(`/admin/jobs/${savedId}`);
  return { ok: true };
}

export async function deleteJob(id: string) {
  await requireUser();
  await db.delete(schema.jobs).where(eq(schema.jobs.id, id));
  updateTag(tags.jobs);
  redirect("/admin/jobs");
}
