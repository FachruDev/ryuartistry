import "server-only";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { logActivity, type Actor } from "@/lib/activity";
import { KEEP_BUILDS, MAX_BUILD_BYTES, PLATFORMS, extensionOk, formatBytes, platformInfo, type Platform } from "@/lib/release-platforms";
import {
  BUILD_CONTENT_TYPE,
  buildObjectSize,
  deleteBuild,
  deleteStaleBuilds,
  hashBuild,
  presignBuildUpload,
} from "@/lib/storage";

/** A problem the editor can fix; the message is shown as is. */
export class ReleaseError extends Error {}

const UPLOAD_TTL_SECONDS = 60 * 60;

export function releaseLabel(project: { title: { id: string; en: string } }, version: string) {
  return `${project.title.id || project.title.en} ${version}`;
}

/** Keeps letters, digits, dots, dashes, and underscores so the name is safe as a key and a header. */
export function safeFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/\s+/g, "-").replace(/[^A-Za-z0-9._-]/g, "").replace(/^[.-]+/, "");
  return clean.slice(-120);
}

// The upload id carries where the object goes, so finalizing needs nothing but the id.
const uploadToken = z.object({ r: z.uuid(), p: z.enum(PLATFORMS), u: z.uuid(), f: z.string().min(1) });
type UploadToken = z.infer<typeof uploadToken>;

const keyFor = (t: UploadToken) => `releases/${t.r}/${t.p}/${t.u}/${t.f}`;

function decodeUploadId(uploadId: string): UploadToken {
  try {
    return uploadToken.parse(JSON.parse(Buffer.from(uploadId, "base64url").toString("utf8")));
  } catch {
    throw new ReleaseError("uploadId tidak valid.");
  }
}

async function findRelease(releaseId: string) {
  const release = await db.query.releases.findFirst({
    where: eq(schema.releases.id, releaseId),
    with: { project: { columns: { id: true, title: true, slug: true } } },
  });
  if (!release) throw new ReleaseError(`Rilis ${releaseId} tidak ditemukan.`);
  return release;
}

/** Step 1: a signed URL the browser (or curl) PUTs the build to, straight into storage. */
export async function prepareBuildUpload(input: { releaseId: string; platform: Platform; filename: string; size?: number }) {
  await findRelease(input.releaseId);
  const filename = safeFilename(input.filename);
  if (!filename) throw new ReleaseError("Nama file tidak valid.");
  if (!extensionOk(input.platform, filename)) {
    throw new ReleaseError(`File ${platformInfo[input.platform].label} harus berakhiran ${platformInfo[input.platform].extensions.join(", ")}.`);
  }
  if (input.size !== undefined && input.size > MAX_BUILD_BYTES) {
    throw new ReleaseError(`File terlalu besar (${formatBytes(input.size)}). Maksimal ${formatBytes(MAX_BUILD_BYTES)}.`);
  }

  // Abandoned uploads for this slot are cleared here instead of by a cron job.
  const prefix = `releases/${input.releaseId}/${input.platform}/`;
  const [current] = await db
    .select({ key: schema.releaseFiles.key })
    .from(schema.releaseFiles)
    .where(and(eq(schema.releaseFiles.releaseId, input.releaseId), eq(schema.releaseFiles.platform, input.platform)));
  await deleteStaleBuilds(prefix, (key) => key === current?.key, 24 * 60 * 60_000);

  const token: UploadToken = { r: input.releaseId, p: input.platform, u: crypto.randomUUID(), f: filename };
  return {
    uploadId: Buffer.from(JSON.stringify(token)).toString("base64url"),
    uploadUrl: await presignBuildUpload(keyFor(token), UPLOAD_TTL_SECONDS),
    contentType: BUILD_CONTENT_TYPE,
    filename,
    expiresAt: new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000).toISOString(),
  };
}

/** Step 2: checks the uploaded object, records it (replacing an older build for the same platform), and applies retention. */
export async function finalizeBuildUpload(uploadId: string, actor: Actor) {
  const token = decodeUploadId(uploadId);
  const key = keyFor(token);
  const release = await findRelease(token.r);

  const size = await buildObjectSize(key);
  if (size === null) throw new ReleaseError("File belum ada di penyimpanan. Pastikan PUT ke uploadUrl selesai (HTTP 200) dan belum kedaluwarsa.");
  if (size > MAX_BUILD_BYTES) {
    await deleteBuild(key);
    throw new ReleaseError(`File terlalu besar (${formatBytes(size)}). Maksimal ${formatBytes(MAX_BUILD_BYTES)}.`);
  }
  const sha256 = await hashBuild(key);

  const [previous] = await db
    .select()
    .from(schema.releaseFiles)
    .where(and(eq(schema.releaseFiles.releaseId, token.r), eq(schema.releaseFiles.platform, token.p)));

  const values = { filename: token.f, key, size, sha256, archivedAt: null };
  const [file] = previous
    ? await db.update(schema.releaseFiles).set(values).where(eq(schema.releaseFiles.id, previous.id)).returning()
    : await db.insert(schema.releaseFiles).values({ releaseId: token.r, platform: token.p, ...values }).returning();
  if (previous?.key && previous.key !== key) await deleteBuild(previous.key).catch(() => {});

  const archived = await applyRetention(release.projectId, token.p);
  await logActivity(actor, previous ? "update" : "create", "release", release.id, `${releaseLabel(release.project, release.version)} · ${platformInfo[token.p].label}`);
  return { file, archived, project: release.project };
}

/**
 * Keeps the newest KEEP_BUILDS builds per project and platform (by release date). Older builds lose
 * their stored file; their rows stay so the version history still lists them.
 */
export async function applyRetention(projectId: string, platform: Platform) {
  const rows = await db
    .select({ id: schema.releaseFiles.id, key: schema.releaseFiles.key, version: schema.releases.version })
    .from(schema.releaseFiles)
    .innerJoin(schema.releases, eq(schema.releaseFiles.releaseId, schema.releases.id))
    .where(and(eq(schema.releases.projectId, projectId), eq(schema.releaseFiles.platform, platform), isNotNull(schema.releaseFiles.key)))
    .orderBy(desc(schema.releases.releasedAt), desc(schema.releases.createdAt));

  const old = rows.slice(KEEP_BUILDS);
  for (const row of old) {
    await deleteBuild(row.key!).catch((error) => console.error("archive build failed", row.key, error));
  }
  if (old.length) {
    await db
      .update(schema.releaseFiles)
      .set({ key: null, archivedAt: new Date() })
      .where(inArray(schema.releaseFiles.id, old.map((r) => r.id)));
  }
  return old.map((r) => r.version);
}

export async function removeBuild(fileId: string, actor: Actor) {
  const [file] = await db.delete(schema.releaseFiles).where(eq(schema.releaseFiles.id, fileId)).returning();
  if (!file) throw new ReleaseError(`File ${fileId} tidak ditemukan.`);
  if (file.key) await deleteBuild(file.key).catch(() => {});
  const release = await findRelease(file.releaseId);
  await logActivity(actor, "delete", "release", release.id, `${releaseLabel(release.project, release.version)} · ${platformInfo[file.platform].label}`);
  return release;
}

export async function removeRelease(releaseId: string, actor: Actor) {
  const release = await findRelease(releaseId);
  const files = await db.select({ key: schema.releaseFiles.key }).from(schema.releaseFiles).where(eq(schema.releaseFiles.releaseId, releaseId));
  await db.delete(schema.releases).where(eq(schema.releases.id, releaseId));
  await Promise.all(files.filter((f) => f.key).map((f) => deleteBuild(f.key!).catch(() => {})));
  await logActivity(actor, "delete", "release", releaseId, releaseLabel(release.project, release.version));
  return release;
}

/** Deletes every stored build of a project. Call before deleting the project; the rows cascade. */
export async function purgeProjectBuilds(projectId: string) {
  const files = await db
    .select({ key: schema.releaseFiles.key })
    .from(schema.releaseFiles)
    .innerJoin(schema.releases, eq(schema.releaseFiles.releaseId, schema.releases.id))
    .where(and(eq(schema.releases.projectId, projectId), isNotNull(schema.releaseFiles.key)));
  await Promise.all(files.map((f) => deleteBuild(f.key!).catch(() => {})));
}

const VERSION = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,39}$/;

export function checkVersion(version: string) {
  if (!VERSION.test(version)) throw new ReleaseError("Versi hanya boleh berisi huruf, angka, titik, tanda hubung, +, atau _ (contoh 2.0.1).");
}

/** Releases of a project with their files, newest first. */
export function getProjectReleases(projectId: string) {
  return db.query.releases.findMany({
    where: eq(schema.releases.projectId, projectId),
    with: { files: true },
    orderBy: [desc(schema.releases.releasedAt), desc(schema.releases.createdAt)],
  });
}
