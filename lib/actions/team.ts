"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { int, links, localized, optionalStr, str, type FormState } from "@/lib/forms";

export async function saveTeamMember(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();

  const name = str(form, "name");
  if (!name) return { fieldErrors: { name: "Nama wajib diisi." }, error: "Periksa kembali isian yang ditandai." };

  const values = {
    name,
    role: localized(form, "role"),
    bio: localized(form, "bio"),
    photoId: optionalStr(form, "photoId"),
    socials: links(form, "socials"),
    sortOrder: int(form, "sortOrder"),
  };

  if (id) {
    await db.update(schema.teamMembers).set(values).where(eq(schema.teamMembers.id, id));
  } else {
    await db.insert(schema.teamMembers).values(values);
  }

  updateTag(tags.team);
  if (!id) redirect("/admin/team");
  return { ok: true };
}

export async function deleteTeamMember(id: string) {
  await requireUser();
  await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id));
  updateTag(tags.team);
  redirect("/admin/team");
}
