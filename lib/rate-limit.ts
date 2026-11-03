import "server-only";
import { createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

// Counters live in Postgres so every serverless instance sees the same numbers;
// in-memory limits reset whenever Vercel starts a new instance.

export type Limit = { key: string; max: number; windowMs: number };

/** The visitor's IP. Vercel overwrites x-forwarded-for, so its first entry is the client. */
export function clientIp(headers: Headers) {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "local";
}

/** Keys hold a keyed hash instead of the raw IP or email, so the table stores no personal data. */
export function hashed(value: string) {
  return createHash("sha256").update(`${process.env.BETTER_AUTH_SECRET ?? ""}:${value}`).digest("hex").slice(0, 32);
}

/** Counts one hit against each limit. Returns the seconds to wait if any limit is now exceeded, else 0. */
export async function hit(...limits: Limit[]) {
  if (Math.random() < 0.01) await sweepExpired();
  let wait = 0;
  for (const { key, max, windowMs } of limits) {
    const fresh = new Date(Date.now() + windowMs);
    const [row] = await db
      .insert(schema.rateLimits)
      .values({ key, count: 1, resetAt: fresh })
      .onConflictDoUpdate({
        target: schema.rateLimits.key,
        set: {
          count: sql`case when ${schema.rateLimits.resetAt} < now() then 1 else ${schema.rateLimits.count} + 1 end`,
          resetAt: sql`case when ${schema.rateLimits.resetAt} < now() then ${fresh} else ${schema.rateLimits.resetAt} end`,
        },
      })
      .returning();
    if (row.count > max) wait = Math.max(wait, secondsUntil(row.resetAt));
  }
  return wait;
}

/** Like hit(), but only reads: the seconds to wait if any limit is already used up, else 0. */
export async function blocked(...limits: Limit[]) {
  const rows = await db
    .select()
    .from(schema.rateLimits)
    .where(inArray(schema.rateLimits.key, limits.map((l) => l.key)));
  let wait = 0;
  for (const row of rows) {
    const limit = limits.find((l) => l.key === row.key)!;
    if (row.resetAt.getTime() > Date.now() && row.count >= limit.max) wait = Math.max(wait, secondsUntil(row.resetAt));
  }
  return wait;
}

export async function reset(key: string) {
  await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, key));
}

/** Expired counters are only clutter; drop a batch now and then. */
export async function sweepExpired() {
  await db.delete(schema.rateLimits).where(sql`${schema.rateLimits.resetAt} < now() - interval '1 day'`);
}

function secondsUntil(date: Date) {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
}

export function waitText(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "sekitar satu menit" : `${minutes} menit`;
}
