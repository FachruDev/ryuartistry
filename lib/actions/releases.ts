"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { tags } from "@/lib/cache-tags";
import { isUniqueViolation, localized, str, type FormState } from "@/lib/forms";
import { logActivity } from "@/lib/activity";
import { PLATFORMS, type Platform } from "@/lib/release-platforms";
import {
  ReleaseError,
  checkVersion,
  finalizeBuildUpload,
  prepareBuildUpload,
  releaseLabel,
  removeBuild,
  removeRelease,
} from "@/lib/releases";

const actorOf = (user: { name: string }) => ({ type: "user" as const, name: user.name });

/** `YYYY-MM-DD` from a date input, kept at noon WIB so the day never shifts across time zones. */
function dateInput(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+07:00`) : null;
}

export async function saveRelease(projectId: string, id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const version = str(form, "version").replace(/^v(?=\d)/i, "");
  try {
    checkVersion(version);
  } catch (error) {
    if (error instanceof ReleaseError) return { fieldErrors: { version: error.message } };
    throw error;
  }

  const [project] = await db.select({ title: schema.projects.title }).from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project) return { error: "Karya tidak ditemukan." };

  const values = {
    version,
    changelog: localized(form, "changelog"),
    status: str(form, "status") === "published" ? ("published" as const) : ("draft" as const),
    releasedAt: dateInput(str(form, "releasedAt")) ?? new Date(),
  };

  let savedId = id;
  try {
    if (id) {
      await db.update(schema.releases).set(values).where(eq(schema.releases.id, id));
    } else {
      const [row] = await db.insert(schema.releases).values({ projectId, ...values }).returning({ id: schema.releases.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { version: `Versi ${version} sudah ada untuk karya ini.` } };
    throw error;
  }

  await logActivity(actorOf(user), id ? "update" : "create", "release", savedId, releaseLabel(project, version));
  updateTag(tags.projects);
  return { ok: true };
}

export type UploadTicket = { uploadId: string; uploadUrl: string; contentType: string } | { error: string };

export async function startBuildUpload(releaseId: string, platform: Platform, filename: string, size: number): Promise<UploadTicket> {
  await requireUser();
  if (!PLATFORMS.includes(platform)) return { error: "Platform tidak dikenal." };
  try {
    const { uploadId, uploadUrl, contentType } = await prepareBuildUpload({ releaseId, platform, filename, size });
    return { uploadId, uploadUrl, contentType };
  } catch (error) {
    if (error instanceof ReleaseError) return { error: error.message };
    throw error;
  }
}

export async function finishBuildUpload(uploadId: string): Promise<{ archived: string[] } | { error: string }> {
  const user = await requireUser();
  try {
    const { archived } = await finalizeBuildUpload(uploadId, actorOf(user));
    updateTag(tags.projects);
    return { archived };
  } catch (error) {
    if (error instanceof ReleaseError) return { error: error.message };
    throw error;
  }
}

export async function deleteBuild(fileId: string) {
  const user = await requireUser();
  await removeBuild(fileId, actorOf(user));
  updateTag(tags.projects);
}

export async function deleteRelease(releaseId: string) {
  const user = await requireUser();
  await removeRelease(releaseId, actorOf(user));
  updateTag(tags.projects);
}
