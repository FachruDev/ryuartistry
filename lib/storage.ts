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
