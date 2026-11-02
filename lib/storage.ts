import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "node:crypto";

export const PUBLIC_BUCKET = "assets-public";

const endpoint = process.env.AWS_ENDPOINT_URL_S3!;

const client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

/** Objects in a `public_read` Neon bucket are served at `<endpoint>/<bucket>/<key>`. */
export function publicUrl(key: string) {
  return `${endpoint.replace(/\/$/, "")}/${PUBLIC_BUCKET}/${key}`;
}

export async function uploadPublic(key: string, body: Uint8Array, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrl(key);
}

export async function deletePublic(key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }));
}

/** A short-lived URL that lets a client PUT one object with exactly this content type. */
export async function presignPublicUpload(key: string, contentType: string, expiresIn: number) {
  return getSignedUrl(client, new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn,
    // Sign the header so the storage rejects a PUT with any other type (e.g. text/html).
    signableHeaders: new Set(["content-type"]),
  });
}

/** Size of an object, or null when it does not exist. */
export async function publicObjectSize(key: string) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }));
    return head.ContentLength ?? 0;
  } catch (error) {
    if (error instanceof NotFound || error instanceof NoSuchKey) return null;
    throw error;
  }
}

export async function readPublic(key: string) {
  const res = await client.send(new GetObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }));
  return new Uint8Array(await res.Body!.transformToByteArray());
}

/** Deletes objects under `prefix` older than `maxAgeMs`. Best effort; errors are ignored. */
export async function deleteStalePublic(prefix: string, maxAgeMs: number) {
  try {
    const list = await client.send(new ListObjectsV2Command({ Bucket: PUBLIC_BUCKET, Prefix: prefix, MaxKeys: 100 }));
    const cutoff = Date.now() - maxAgeMs;
    const stale = (list.Contents ?? []).filter((o) => o.Key && o.LastModified && o.LastModified.getTime() < cutoff);
    await Promise.all(stale.map((o) => deletePublic(o.Key!)));
  } catch (error) {
    console.error("stale upload cleanup failed", error);
  }
}

// ---------------------------------------------------------------------------
// Downloadable builds live in their own bucket. Visitors get short-lived signed links from
// /api/download so every download is counted and saved under its real filename.
// ---------------------------------------------------------------------------

export const APP_BUCKET = "application";
export const BUILD_CONTENT_TYPE = "application/octet-stream";

/** A short-lived URL that lets a client PUT one build (any binary) to `key`. */
export async function presignBuildUpload(key: string, expiresIn: number) {
  return getSignedUrl(client, new PutObjectCommand({ Bucket: APP_BUCKET, Key: key, ContentType: BUILD_CONTENT_TYPE }), {
    expiresIn,
    signableHeaders: new Set(["content-type"]),
  });
}

/** A short-lived link that downloads the build as an attachment named `filename`. */
export async function presignBuildDownload(key: string, filename: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: APP_BUCKET,
      Key: key,
      ResponseContentType: contentType,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"`,
    }),
    { expiresIn },
  );
}

export async function buildObjectSize(key: string) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: APP_BUCKET, Key: key }));
    return head.ContentLength ?? 0;
  } catch (error) {
    if (error instanceof NotFound || error instanceof NoSuchKey) return null;
    throw error;
  }
}

/** SHA-256 of a stored build, streamed so large files never sit in memory. */
export async function hashBuild(key: string) {
  const res = await client.send(new GetObjectCommand({ Bucket: APP_BUCKET, Key: key }));
  const hash = createHash("sha256");
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) hash.update(chunk);
  return hash.digest("hex");
}

export async function deleteBuild(key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: APP_BUCKET, Key: key }));
}

/** Deletes objects under `prefix` that are not `keep` and older than `maxAgeMs` (abandoned uploads). Best effort. */
export async function deleteStaleBuilds(prefix: string, keep: (key: string) => boolean, maxAgeMs: number) {
  try {
    const list = await client.send(new ListObjectsV2Command({ Bucket: APP_BUCKET, Prefix: prefix, MaxKeys: 100 }));
    const cutoff = Date.now() - maxAgeMs;
    const stale = (list.Contents ?? []).filter(
      (o) => o.Key && !keep(o.Key) && o.LastModified && o.LastModified.getTime() < cutoff,
    );
    await Promise.all(stale.map((o) => deleteBuild(o.Key!)));
  } catch (error) {
    console.error("stale build cleanup failed", error);
  }
}
