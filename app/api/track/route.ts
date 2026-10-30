import { createHash } from "node:crypto";
import { userAgent } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { db, schema } from "@/lib/db";

const viewSchema = z.object({
  type: z.literal("view"),
  id: z.uuid(),
  sessionId: z.string().min(8).max(64),
  path: z.string().startsWith("/").max(300),
  referrer: z.string().max(500).optional(),
});

const leaveSchema = z.object({
  type: z.literal("leave"),
  id: z.uuid(),
  durationMs: z.number().int().min(0).max(6 * 60 * 60 * 1000),
});

const bodySchema = z.discriminatedUnion("type", [viewSchema, leaveSchema]);

// The salt changes every UTC day, so the same person gets a new id tomorrow.
function visitorId(ip: string, ua: string) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${process.env.BETTER_AUTH_SECRET ?? ""}:${day}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}

function referrerHost(referrer: string | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host && host !== ownHost?.replace(/^www\./, "").split(":")[0] ? host : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Signed-in editors previewing the site would skew the numbers.
  if (getSessionCookie(request.headers)) return new Response(null, { status: 204 });

  const ua = userAgent(request);
  if (ua.isBot) return new Response(null, { status: 204 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(JSON.parse(await request.text()));
  } catch {
    return new Response(null, { status: 400 });
  }

  if (body.type === "leave") {
    await db
      .update(schema.pageViews)
      .set({ durationMs: body.durationMs })
      .where(and(eq(schema.pageViews.id, body.id), isNull(schema.pageViews.durationMs)));
    return new Response(null, { status: 204 });
  }

  const url = new URL(body.path, "http://x");
  const locale = url.pathname.split("/")[1];
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";

  await db
    .insert(schema.pageViews)
    .values({
      id: body.id,
      path: url.pathname.replace(/\/$/, "") || "/",
      locale: locale === "id" || locale === "en" ? locale : null,
      referrer: referrerHost(body.referrer, request.headers.get("host")),
      utmSource: url.searchParams.get("utm_source")?.slice(0, 80) || null,
      visitorId: visitorId(ip, ua.ua),
      sessionId: body.sessionId,
      country: request.headers.get("x-vercel-ip-country"),
      device: ua.device.type === "mobile" || ua.device.type === "tablet" ? ua.device.type : "desktop",
      browser: ua.browser.name ?? null,
      os: ua.os.name ?? null,
    })
    .onConflictDoNothing();

  return new Response(null, { status: 204 });
}
