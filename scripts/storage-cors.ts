/**
 * Lets the CMS upload builds from the browser straight into the `application` bucket.
 * Run again after adding a domain: `bun scripts/storage-cors.ts https://example.com`
 */
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const BUCKET = "application";

const origins = [
  "http://localhost:3000",
  "https://ryuartistry.vercel.app",
  process.env.SITE_URL,
  ...process.argv.slice(2),
]
  .filter((o): o is string => !!o)
  .map((o) => o.replace(/\/$/, ""));

const client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
  forcePathStyle: true,
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [...new Set(origins)],
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["content-type"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

const { CORSRules } = await client.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
console.log(JSON.stringify(CORSRules, null, 2));
