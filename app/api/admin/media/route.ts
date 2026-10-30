import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { slugify } from "@/lib/forms";
import { uploadPublic } from "@/lib/storage";

// Vercel Functions reject request bodies over 4.5 MB, so cap uploads just below that.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Sesi berakhir. Silakan masuk lagi." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Pilih file gambar." }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return Response.json({ error: "Format didukung: JPG, PNG, WebP, AVIF, GIF." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Ukuran maksimal 4 MB." }, { status: 400 });

  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const now = new Date();
  const key = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;

  const url = await uploadPublic(key, new Uint8Array(await file.arrayBuffer()), file.type);
  const alt = typeof form.get("alt") === "string" ? String(form.get("alt")).trim() : "";
  const [row] = await db
    .insert(schema.media)
    .values({ key, url, mime: file.type, size: file.size, width, height, alt: { id: alt, en: alt } })
    .returning();

  return Response.json(row);
}
