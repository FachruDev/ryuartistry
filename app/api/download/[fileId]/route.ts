import { userAgent } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getSessionCookie } from "better-auth/cookies";
import { db, schema } from "@/lib/db";
import { downloadContentType } from "@/lib/release-platforms";
import { presignBuildDownload } from "@/lib/storage";

/** Counts the download, then redirects to a short-lived signed link that saves the build under its own name. */
export async function GET(request: Request, { params }: RouteContext<"/api/download/[fileId]">) {
  const { fileId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(fileId)) return new Response("Not found", { status: 404 });

  const file = await db.query.releaseFiles.findFirst({
    where: eq(schema.releaseFiles.id, fileId),
    with: { release: { with: { project: { columns: { status: true, slug: true } } } } },
  });
  const signedIn = Boolean(getSessionCookie(request.headers));
  const visible = file && file.release.status === "published" && file.release.project.status === "published";
  // Editors can fetch drafts from the CMS; visitors only see what is published.
  if (!file || (!visible && !signedIn)) return new Response("Not found", { status: 404 });
  if (!file.key) {
    return new Response("Versi ini sudah diarsipkan dan filenya tidak tersedia lagi.", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Editors and bots would skew the numbers.
  if (!signedIn && !userAgent(request).isBot) {
    await db
      .update(schema.releaseFiles)
      .set({ downloads: sql`${schema.releaseFiles.downloads} + 1` })
      .where(eq(schema.releaseFiles.id, file.id));
  }

  const url = await presignBuildDownload(file.key, file.filename, downloadContentType(file.filename));
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
}
