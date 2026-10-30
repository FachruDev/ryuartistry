"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { int, links, localized, optionalStr, str, type FormState } from "@/lib/forms";
import { logActivity } from "@/lib/activity";

export async function saveTeamMember(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

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

  let savedId = id;
  if (id) {
    await db.update(schema.teamMembers).set(values).where(eq(schema.teamMembers.id, id));
  } else {
    const [row] = await db.insert(schema.teamMembers).values(values).returning({ id: schema.teamMembers.id });
    savedId = row.id;
  }
  await logActivity({ type: "user", name: user.name }, id ? "update" : "create", "team", savedId, name);

  updateTag(tags.team);
  if (!id) redirect("/admin/team");
  return { ok: true };
}

export async function deleteTeamMember(id: string) {
  const user = await requireUser();
  const [row] = await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id)).returning({ name: schema.teamMembers.name });
  if (row) await logActivity({ type: "user", name: user.name }, "delete", "team", id, row.name);
  updateTag(tags.team);
  redirect("/admin/team");
}
