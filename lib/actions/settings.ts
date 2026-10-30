"use server";

import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { links, localized, optionalStr, type FormState } from "@/lib/forms";

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const values = {
    tagline: localized(form, "tagline"),
    heroTitle: localized(form, "heroTitle"),
    heroSubtitle: localized(form, "heroSubtitle"),
    contactEmail: optionalStr(form, "contactEmail"),
    socials: links(form, "socials"),
  };
  await db
    .insert(schema.siteSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: schema.siteSettings.id, set: values });
  updateTag(tags.settings);
  return { ok: true };
}
