import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
