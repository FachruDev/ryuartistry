import "server-only";
import { db, schema } from "@/lib/db";
import type { Localized } from "@/lib/db/schema";

export type Actor = { type: "user" | "ai"; name: string };
export type Entity = "project" | "post" | "service" | "team" | "category" | "media" | "settings" | "inquiry";

export const entityLabel: Record<Entity, string> = {
  project: "karya",
  post: "catatan Lab",
  service: "layanan",
  team: "anggota tim",
  category: "kategori",
  media: "media",
  settings: "pengaturan situs",
  inquiry: "pesan",
};

/** Best readable name for a bilingual title. */
export function titleOf(value: Localized | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id || value.en;
}

/** Records who changed what. Never throws: a failed log must not fail the save. */
export async function logActivity(
  actor: Actor,
  action: "create" | "update" | "delete",
  entity: Entity,
  entityId: string | null,
  label: string,
) {
  try {
    await db.insert(schema.activityLog).values({
      actorType: actor.type,
      actorName: actor.name,
      action,
      entity,
      entityId,
      label: label || "(tanpa judul)",
    });
  } catch (error) {
    console.error("activity log failed", error);
  }
}
