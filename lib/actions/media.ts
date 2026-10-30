"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { deletePublic } from "@/lib/storage";
import type { Media } from "@/lib/db/schema";

// Media appears inside cached projects, posts and team pages.
function invalidateContent() {
  updateTag(tags.projects);
  updateTag(tags.posts);
  updateTag(tags.team);
}

export async function listMedia(): Promise<Media[]> {
  await requireUser();
  return db.select().from(schema.media).orderBy(desc(schema.media.createdAt)).limit(200);
}

export async function getMediaByIds(ids: string[]): Promise<Media[]> {
  await requireUser();
  if (!ids.length) return [];
  return db.select().from(schema.media).where(inArray(schema.media.id, ids));
}

export async function updateMediaAlt(id: string, alt: { id: string; en: string }) {
  await requireUser();
  await db
    .update(schema.media)
    .set({ alt: { id: alt.id.trim(), en: alt.en.trim() } })
    .where(eq(schema.media.id, id));
  invalidateContent();
}

export async function deleteMedia(id: string) {
  await requireUser();
  const [row] = await db.delete(schema.media).where(eq(schema.media.id, id)).returning();
  if (row) await deletePublic(row.key);
  invalidateContent();
  refresh();
}
